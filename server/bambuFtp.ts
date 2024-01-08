import * as ftp from "basic-ftp";

export class BambuFtpClient {
	host: string;
	accessCode: string;
	client: ftp.Client;
	port: number;

	constructor(host: string, accessCode: string, port: number = 990) {
		this.host = host;
		this.accessCode = accessCode;
		this.client = new ftp.Client();
		this.port = port;
	}

	async connect() {
		try {
			await this.client.access({
				host: this.host,
				port: this.port,
				user: "bblp",
				password: this.accessCode,
				secureOptions: {
					rejectUnauthorized: false,
				},
				secure: "implicit",
			});
			console.log("[FTP] Connected to printer");
		} catch (err) {
			console.log("[FTP] Connection failed");
			console.log(err);
		}
	}

	disconnect() {
		this.client.close();
		console.log("[FTP] Disconnected from printer");
	}

	async getModels() {
		try {
			await this.connect();

			// Create directory if it doesn't exist
			await this.client.ensureDir("/model");

			// Get models
			const models = await this.client.list("/model");
			console.log("[FTP] Received models");

			this.disconnect();
			return models.map((model) => model.name);
		} catch (err) {
			console.log(`[FTP] Failed to get models: ${err.message ?? err}`);
			return [];
		}
	}

	async sendModel(filePath: string, fileName: string) {
		try {
			await this.connect();

			// Create directory if it doesn't exist
			await this.client.ensureDir("/model");

			// Upload file
			console.log(
				`[FTP] Sending model '${fileName}', this may take a while...`,
			);
			await this.client.uploadFrom(filePath, `/model/${fileName}`);
			console.log(`[FTP] Sent model`);

			this.disconnect();
		} catch (err) {
			console.log(`[FTP] Failed to send model: ${err.message ?? err}`);
		}
	}

	async deleteModel(fileName: string) {
		try {
			await this.connect();
			await this.client.remove(`/model/${fileName}`);
			console.log(`[FTP] Deleted model '${fileName}'`);
			this.disconnect();
		} catch (err) {
			console.log("[FTP] Failed to delete model:");
			console.log(err.message ?? err);
		}
	}
}

export default BambuFtpClient;
