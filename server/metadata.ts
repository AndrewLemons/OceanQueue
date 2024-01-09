import * as fs from "node:fs";
import * as readline from "node:readline";

export default class Metadata {
	image: string;
	materials: string[];
	printTime: number;
	layers: number;
	printerModel: string;

	constructor(
		image: string = "",
		materials: string[] = [],
		printTime: number = 0,
		layers: number = 0,
		printerModel: string = "",
	) {
		this.image = image;
		this.materials = materials;
		this.printTime = printTime;
		this.layers = layers;
		this.printerModel = printerModel;
	}

	public static async parseFromFile(filePath: string): Promise<Metadata> {
		let stream = fs.createReadStream(filePath);
		let rl = readline.createInterface(stream);

		let state = ParserState.None;
		let metadata = new Metadata();

		for await (const line of rl) {
			if (line === "; EXECUTABLE_BLOCK_START") break;

			// Header block
			if (line === "; HEADER_BLOCK_START") {
				state = ParserState.HeaderBlock;
				continue;
			} else if (line === "; HEADER_BLOCK_END") {
				state = ParserState.None;
				continue;
			} else if (line.startsWith("; total layer number")) {
				let layers = parseInt(line.substring(21));
				metadata.layers = layers;
				continue;
			}

			// Config block
			if (line === "; CONFIG_BLOCK_START") {
				state = ParserState.ConfigBlock;
				continue;
			} else if (line === "; CONFIG_BLOCK_END") {
				state = ParserState.None;
				continue;
			} else if (line.startsWith("; printer_model")) {
				let printerModel = line.substring(18);
				metadata.printerModel = printerModel;
				continue;
			} else if (line.startsWith("; filament_settings_id")) {
				let filamentSettingsId = line.substring(25);
				metadata.materials.push(...filamentSettingsId.split(";"));
				continue;
			}

			// Thumbnails
			if (line === "; THUMBNAIL_BLOCK_START") {
				state = ParserState.ThumbnailBlock;
				continue;
			} else if (line.startsWith("; thumbnail begin")) {
				state = ParserState.ThumbnailData;
				continue;
			} else if (line.startsWith("; thumbnail end")) {
				state = ParserState.ThumbnailBlock;
				continue;
			} else if (line === "; THUMBNAIL_BLOCK_END") {
				state = ParserState.None;
				continue;
			} else if (state === ParserState.ThumbnailData) {
				metadata.image += line.substring(2);
				continue;
			}
		}

		rl.close();
		stream.close();

		return metadata;
	}
}

enum ParserState {
	None,
	HeaderBlock,
	ConfigBlock,
	ThumbnailBlock,
	ThumbnailData,
}
