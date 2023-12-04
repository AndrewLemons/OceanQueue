import BambuFtpClient from "./ftp";
import BambuMqttClient from "./mqtt";
import { Queue, QueueItemState } from "./queue";

export class BambuPrinter {
	host: string;
	serial: string;
	code: string;
	name: string;
	state: BambuPrinterState;
	queue: Queue;
	ftpClient: BambuFtpClient;
	mqttClient: BambuMqttClient;

	constructor(
		host: string,
		serial: string,
		code: string,
		name: string,
		mqttPort: number = 8883,
		ftpPort: number = 990,
	) {
		this.host = host;
		this.serial = serial;
		this.code = code;
		this.name = name ?? serial;
		this.state = new BambuPrinterState();
		this.queue = new Queue(this.serial);
		this.ftpClient = new BambuFtpClient(this.host, this.code, ftpPort);
		this.mqttClient = new BambuMqttClient(
			this.host,
			this.serial,
			this.code,
			mqttPort,
		);
	}

	async connect() {
		this.mqttClient.connect();

		this.mqttClient.listen(async (data: any) => {
			this.state.updateState(data);
			await this.onStateUpdate();
		});
	}

	async onStateUpdate() {
		let printHash = this.state.subtask_name.substring(0, 4);
		let printState = this.state.gcode_state;
		console.log("Printer state", printState);

		if (printState == "RUNNING") {
			// If there is a queue
			if (this.queue.items.length > 0) {
				// And the last item matches
				if (
					this.queue.items[0].hash.substring(0, 4) == printHash &&
					this.queue.items[0].state == QueueItemState.SENT
				) {
					// Update the item state
					let item = this.queue.items[0];
					item.state = QueueItemState.PRINTING;
					this.queue.update(item);
				}
			}
		}

		if (printState === "FAILED") {
			// If there is a queue and the hash matches
			if (this.queue.items.length > 0) {
				if (this.queue.items[0].hash.substring(0, 4) == printHash) {
					// Update the item state
					let item = this.queue.items[0];
					item.state = QueueItemState.FAILED;
					this.queue.update(item);
				} else {
					await this.prepareNextPrint();
				}
			}
		}

		if (printState == "IDLE") {
			// If there is a queue
			if (this.queue.items.length > 0) {
				// And if the next item has not been sent
				if (this.queue.items[0].state !== QueueItemState.SENT) {
					await this.prepareNextPrint();
				}
			}
		}

		if (printState == "FINISH") {
			// If there is a queue
			if (this.queue.items.length > 0) {
				if (this.queue.items[0].state == QueueItemState.SENT) {
					// We have sent the next item, it has not been started yet
					return;
				}

				// Remove the old item(s)
				let models = await this.ftpClient.getModels();
				console.log("Delete the old model files");
				for (let model of models) {
					await this.ftpClient.deleteModel(model);
				}

				// And the last item matches
				if (this.queue.items[0].hash.substring(0, 4) == printHash) {
					// Remove the item
					console.log("Unqueue the printer item");
					this.queue.remove(this.queue.items[0]);

					if (this.queue.items.length === 0) {
						return;
					}
				}

				// Send the next item
				console.log("Send the new model file");
				let nextItem = this.queue.items[0];
				await this.ftpClient.sendModel(
					nextItem.getFilePath(),
					nextItem.hash.substring(0, 4) + "-" + nextItem.fileName,
				);

				// Update the item state
				nextItem.state = QueueItemState.SENT;
				this.queue.update(nextItem);
			}
		}
	}

	async onPrintUpload() {
		let printState = this.state.gcode_state;

		if (printState == "FINISH" || printState == "IDLE") {
			// If there is no queue
			if (this.queue.items.length === 0) {
				await this.prepareNextPrint();
			}
		}
	}

	private async deleteModels() {
		let models = await this.ftpClient.getModels();
		for (let model of models) {
			await this.ftpClient.deleteModel(model);
		}
	}

	private async prepareNextPrint() {
		// Remove the old item(s)
		await this.deleteModels();

		// Send the new model file
		let nextItem = this.queue.items[0];
		await this.ftpClient.sendModel(
			nextItem.getFilePath(),
			nextItem.hash.substring(0, 4) + "-" + nextItem.fileName,
		);

		// Update the item state
		nextItem.state = QueueItemState.SENT;
		this.queue.update(nextItem);
	}
}

export class BambuPrinterState {
	gcode_file: string;
	gcode_state: string;
	total_layers_num: number;
	layer_num: number;
	mc_percent: number;
	mc_remaining_time: number;
	subtask_name: string;

	constructor(initialState: any = {}) {
		this.gcode_file = initialState["gcode_file"] ?? "";
		this.gcode_state = initialState["gcode_state"] ?? "";
		this.total_layers_num = initialState["total_layers_num"] ?? 0;
		this.layer_num = initialState["layer_num"] ?? 0;
		this.mc_percent = initialState["mc_percent"] ?? 0;
		this.mc_remaining_time = initialState["mc_remaining_time"] ?? 0;
		this.subtask_name = initialState["subtask_name"] ?? "";
	}

	updateState(source: any = {}) {
		if (source.print) {
			// Update each key, only if it exists
			this.gcode_file = source.print.gcode_file ?? this.gcode_file;
			this.gcode_state = source.print.gcode_state ?? this.gcode_state;
			this.total_layers_num =
				source.print.total_layers_num ?? this.total_layers_num;
			this.layer_num = source.print.layer_num ?? this.layer_num;
			this.mc_percent = source.print.mc_percent ?? this.mc_percent;
			this.mc_remaining_time =
				source.print.mc_remaining_time ?? this.mc_remaining_time;
			this.subtask_name = source.print.subtask_name ?? this.subtask_name;
		}
	}

	toJSON() {
		return {
			gcode_file: this.gcode_file,
			gcode_state: this.gcode_state,
			total_layers_num: this.total_layers_num,
			layer_num: this.layer_num,
			mc_percent: this.mc_percent,
			mc_remaining_time: this.mc_remaining_time,
			subtask_name: this.subtask_name,
		};
	}

	toString() {
		return JSON.stringify(this.toJSON());
	}
}

export default {
	BambuPrinter,
	BambuPrinterState,
};
