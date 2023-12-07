import BambuFtpClient from "./bambuFtp";
import BambuMqttClient from "./bambuMqtt";
import { Queue, QueueItem, QueueItemState } from "./queue";

export class BambuPrinter {
	host: string;
	serial: string;
	code: string;
	name: string;
	state: BambuPrinterState;
	queue: Queue;
	ftpClient: BambuFtpClient;
	mqttClient: BambuMqttClient;

	lastState: string;
	lastQueueLength: number;

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

		this.lastState = "";
		this.lastQueueLength = -1;
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

		if (printState !== this.lastState) {
			// Update the state if it has changed
			console.log(`[UPDATE] State changed to ${printState}`);
		} else if (this.queue.items.length !== this.lastQueueLength) {
			// Update if the queue length has changed
			console.log("[UPDATE] Queue changed");
		} else {
			// Don't update if nothing has changed
			return;
		}

		this.lastQueueLength = this.queue.items.length;
		this.lastState = this.state.gcode_state;

		if (this.queue.items.length === 0) {
			// If the queue is empty, return
			return;
		}

		if (printState === "RUNNING" || printState === "PREPARE") {
			// Update the state of the latest queue item if...
			if (
				this.queue.items[0].hash.substring(0, 4) == printHash && // it is running
				this.queue.items[0].state == QueueItemState.SENT // It is currently marked as sent
			) {
				let item = this.queue.items[0];
				item.state = QueueItemState.PRINTING;
				this.queue.update(item);
			}
		}

		if (printState === "FAILED") {
			// If the latest queue item has failed
			if (this.queue.items[0].hash.substring(0, 4) == printHash) {
				// Update the item state for a human to handle it
				let item = this.queue.items[0];
				item.state = QueueItemState.FAILED;
				this.queue.update(item);
			} else {
				// Remove the unknown item and prepare the next queue item
				console.log("[UPDATE] Printer has failed with unknown job");
				await this.prepareNextQueueItem();
			}
		}

		if (printState == "IDLE") {
			// If the next item has not been sent yet...
			if (this.queue.items[0].state !== QueueItemState.SENT) {
				await this.prepareNextQueueItem();
			}
		}

		if (printState == "FINISH") {
			let item = this.queue.items[0];

			if (item.state === QueueItemState.SENT) {
				// We have already sent the new item
				return;
			}

			if (item.hash.substring(0, 4) === printHash) {
				// The item is completed, remove it from the queue
				console.log(
					`[UPDATE] Printer has finished ${item.hash.substring(0, 4)}`,
				);

				this.queue.remove(item);

				// If the queue is now empty, return
				if (this.queue.items.length === 0) {
					return;
				}
			}

			// Prepare the next item
			await this.prepareNextQueueItem();
		}
	}

	private async deleteModels() {
		console.log(`[CLEAN] Removing old model files`);

		let models = await this.ftpClient.getModels();
		for (let model of models) {
			await this.ftpClient.deleteModel(model);
		}
	}

	private async sendModel(queueItem: QueueItem) {
		let modelPath = queueItem.getFilePath();
		let modelName = queueItem.hash.substring(0, 4) + "-" + queueItem.fileName;

		console.log(
			`[SEND] Sending model file '${this.queue.items[0].hash.substring(0, 4)}'`,
		);

		await this.ftpClient.sendModel(modelPath, modelName);
	}

	async syncQueue() {
		if (this.queue.items.length === 0) {
			return;
		}

		let item = this.queue.items[0];
		if (item.state !== QueueItemState.SENT) {
			await this.prepareNextQueueItem();
		}
	}

	private async prepareNextQueueItem() {
		let nextItem = this.queue.items[0];

		console.log("[PREPARE] Preparing next queue item");

		// Remove the old item(s)
		await this.deleteModels();

		// Send the new model file
		await this.sendModel(nextItem);

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

	lastChanges: string[];

	constructor(initialState: any = {}) {
		this.gcode_file = initialState["gcode_file"] ?? "";
		this.gcode_state = initialState["gcode_state"] ?? "";
		this.total_layers_num = initialState["total_layers_num"] ?? 0;
		this.layer_num = initialState["layer_num"] ?? 0;
		this.mc_percent = initialState["mc_percent"] ?? 0;
		this.mc_remaining_time = initialState["mc_remaining_time"] ?? 0;
		this.subtask_name = initialState["subtask_name"] ?? "";

		this.lastChanges = [];
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

			// Update the last changes
			this.lastChanges = Object.keys(source.print);
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
