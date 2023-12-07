import fs from "fs-extra";
import crypto from "node:crypto";
import path from "node:path";
import util from "node:util";
import { pipeline } from "node:stream";
import { FastifyPluginAsync } from "fastify";
import { MultipartFile } from "@fastify/multipart";
import { printers } from "../state";
import config from "../config";

const pump = util.promisify(pipeline);

const KEY = config.apiKey;

const router: FastifyPluginAsync = async (fastify, opts) => {
	fastify.get("/version", async (request, reply) => {
		return {
			api: "0.1",
			server: "1.3.10",
			text: "OctoPrint (OceanQueue) 1.3.10",
		};
	});

	fastify.post<{
		Headers: {
			"x-api-key": string;
		};
		Body: {
			file: MultipartFile;
		};
	}>("/files/local", async (request, reply) => {
		const token = request.headers["x-api-key"];
		let tokenParts = token.split(":");
		if (tokenParts[0] !== KEY) {
			reply.status(403);
			return "Invalid API key given";
		}

		let printer = printers.find((p) => p.serial === tokenParts[1]);
		if (!printer) {
			reply.status(404);
			return "The requested printer does not exist";
		}

		const data = await request.file();
		if (!data) {
			reply.status(400);
			return "No print file uploaded";
		}
		const fileName = data.filename;

		// Get the hash of the uploaded file
		const hash = crypto.createHash("sha256");
		hash.setEncoding("hex");
		hash.write(new Date().toISOString());
		hash.write(fileName);
		hash.end();
		const fileHash: string = hash.read().toUpperCase();

		// Save the file to a temp location
		const tmpPath = path.join(__dirname, "..", "..", "tmp", fileHash);
		await fs.ensureDir(path.dirname(tmpPath));
		await pump(data.file, fs.createWriteStream(tmpPath));

		const queueItem = printer.queue.add(fileName, fileHash);
		await queueItem.updateFile(tmpPath);

		console.log("[UPLOAD] File uploaded");

		// Act like this works
		reply.status(204);
		return {
			files: {
				local: {
					name: fileName,
					origin: "local",
				},
			},
			done: true,
		};
	});
};

export default router;
