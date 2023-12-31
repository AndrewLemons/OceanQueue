import mqtt from "mqtt";

export class BambuMqttClient {
	host: string;
	serial: string;
	accessCode: string;
	client: mqtt.MqttClient | null;
	listeners: Array<(data: any) => void>;
	port: number;

	constructor(
		host: string,
		serial: string,
		accessCode: string,
		port: number = 8883,
	) {
		this.host = host;
		this.serial = serial;
		this.accessCode = accessCode;
		this.client = null;
		this.listeners = [];
		this.port = port;
	}

	connect() {
		this.client = mqtt.connect(`mqtt://${this.host}:${this.port}`, {
			username: "bblp",
			password: this.accessCode,
			clientId: "bblp",
			protocol: "mqtts",
			rejectUnauthorized: false,
		});

		this.client.on("connect", this.#onConnect.bind(this));
		this.client.on("message", this.#onMessage.bind(this));
	}

	#onConnect() {
		if (!this.client) return;
		console.log("[MQTT] Connected to printer");
		this.client.subscribe(`device/${this.serial}/report`);
		console.log("[MQTT] Subscribed to printer");
		this.client.publish(
			`device/${this.serial}/request`,
			JSON.stringify({ pushing: { sequence_id: "0", command: "pushall" } }),
		);
	}

	#onMessage(topic: string, message: any) {
		let data = JSON.parse(message.toString());
		this.listeners.forEach((listener) => listener(data));
	}

	listen(callback: (data: any) => void) {
		this.listeners.push(callback);
	}
}

export default BambuMqttClient;
