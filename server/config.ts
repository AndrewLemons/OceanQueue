import path from "node:path";
import fs from "fs-extra";

const configPath = path.resolve(__dirname, process.env.CONFIG_FILE ?? "../config.json");
const configFile = fs.readJSONSync(configPath);
export const config = configFile as IConfiguration;

config.dataPath = path.resolve(__dirname, "../", config.dataPath);
fs.ensureDirSync(config.dataPath);

export default config;

interface IConfiguration {
	dataPath: string;
	printers: Array<{
		host: string;
		serial: string;
		accessCode: string;
		name: string;
		mqttPort?: number;
		ftpPort?: number;
	}>;
	apiKey: string;
}
