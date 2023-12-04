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
		console.log("CONNECT");
		try {
			console.log("Connecting to FTP server");
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
		} catch (err) {
			console.log("Failed to connect to FTP server:");
			console.log(err);
		}
		console.log("CONNECT DONE");
	}

	disconnect() {
		console.log("Disconnecting from FTP server");
		this.client.close();
	}

	async getModels() {
		try {
			await this.connect();
			console.log("GET MODELS");
			const models = await this.client.list("/model");
			console.log("GET MODELS DONE");
			this.disconnect();
			return models.map((model) => model.name);
		} catch (err) {
			console.log("Failed to get models:");
			console.log(err);
			return [];
		}
	}

	async sendModel(filePath: string, fileName: string) {
		try {
			await this.connect();
			console.log("SEND MODEL");
			await this.client.uploadFrom(filePath, `/model/${fileName}`);
			console.log("SEND MODEL DONE");
			this.disconnect();
		} catch (err) {
			console.log("Failed to send model:");
			console.log(err);
		}
	}

	async deleteModel(fileName: string) {
		try {
			await this.connect();
			console.log("REMOVE MODEL");
			await this.client.remove(`/model/${fileName}`);
			console.log("REMOVE MODEL DONE");
			this.disconnect();
		} catch (err) {
			console.log("Failed to delete model:");
			console.log(err);
		}
	}
}

export default BambuFtpClient;
