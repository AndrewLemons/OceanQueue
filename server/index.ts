import path from "node:path";
import fastify from "fastify";

import { printers } from "./state";
import multipartPlugin from "@fastify/multipart";
import staticPlugin from "@fastify/static";
import octoprintRoutes from "./routes/octoprint";
import oceanqueueRoutes from "./routes/oceanqueue";

async function main() {
	for (let printer of printers) {
		await printer.connect();
	}

	const server = fastify();

	server.register(multipartPlugin);
	server.register(staticPlugin, {
		root: path.resolve(__dirname, "../dist-client"),
	});
	server.register(octoprintRoutes, { prefix: "/api" });
	server.register(oceanqueueRoutes, { prefix: "/oceanqueue" });

	server.listen({
		host: "0.0.0.0",
		port: 5000,
	});
}

main();
