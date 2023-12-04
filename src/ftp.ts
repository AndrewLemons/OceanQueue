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
		} catch (err) {
			console.log(err);
		}
	}

	disconnect() {
		this.client.close();
	}

	async getModels() {
		try {
			await this.connect();
			const models = await this.client.list("/model");
			await this.disconnect();
			return models.map((model) => model.name);
		} catch (err) {
			console.log(err);
			return [];
		}
	}

	async sendModel(filePath: string, fileName: string) {
		try {
			await this.connect();
			await this.client.uploadFrom(filePath, `/model/${fileName}`);
			await this.disconnect();
		} catch (err) {
			console.log(err);
		}
	}

	async deleteModel(fileName: string) {
		try {
			await this.connect();
			await this.client.remove(`/model/${fileName}`);
			await this.disconnect();
		} catch (err) {
			console.log(err);
		}
	}
}

export default BambuFtpClient;
