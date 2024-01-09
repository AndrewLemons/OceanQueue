import { printers } from "../state";
import { FastifyPluginAsync } from "fastify";

const router: FastifyPluginAsync = async (fastify, opts) => {
	fastify.get("/printers", async (request, reply) => {
		let printerMap = printers.map((printer) => ({
			name: printer.name,
			serial: printer.serial,
			current: printer.state.gcode_file,
			state: printer.state.gcode_state,
			progress: printer.state.mc_percent / 100,
			remaining: printer.state.mc_remaining_time,
			queueSize: printer.queue.items.length,
			firstQueueItem: printer.queue.items[0],
		}));

		return {
			success: true,
			printers: printerMap,
		};
	});

	fastify.get<{
		Params: {
			serial: string;
		};
	}>("/printers/:serial", async (request, reply) => {
		let printer = printers.find(
			(printer) => printer.serial === request.params.serial,
		);

		if (!printer) {
			reply.status(404);
			return {
				success: false,
				message: "Printer not found",
			};
		}

		return {
			success: true,
			printer: {
				name: printer.name,
				serial: printer.serial,
				...printer.state,
				queue: printer.queue.getAll(),
			},
		};
	});

	fastify.delete<{
		Params: {
			printerSerial: string;
			queueItemId: number;
		};
	}>("/printers/:printerSerial/queue/:queueItemId", async (request, reply) => {
		let printer = printers.find(
			(printer) => printer.serial === request.params.printerSerial,
		);

		if (!printer) {
			reply.status(404);
			return {
				success: false,
				message: "Printer not found",
			};
		}

		let queueItem = printer.queue.items.find(
			(item) => item.id == request.params.queueItemId,
		);

		if (!queueItem) {
			reply.status(404);
			return {
				success: false,
				message: "Queue item not found",
			};
		}

		printer.queue.remove(queueItem);
		printer.syncQueue();

		return {
			success: true,
		};
	});
};

export default router;
