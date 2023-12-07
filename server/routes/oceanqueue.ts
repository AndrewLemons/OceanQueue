import { printers } from "../state";
import { FastifyPluginAsync } from "fastify";

const router: FastifyPluginAsync = async (fastify, opts) => {
	fastify.get("/printers", async (request, reply) => {
		let printerMap = printers.map((printer) => ({
			name: printer.name,
			serial: printer.serial,
			current: printer.state.gcode_file,
			state: printer.state.gcode_state,
		}));

		return {
			success: true,
			printers: printerMap,
		};
	});

	fastify.get<{
		Params: {
			printer: string;
		};
	}>("/printers/:printer", async (request, reply) => {
		let printer = printers.find(
			(printer) => printer.serial === request.params.printer,
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
			printer: printer.state,
		};
	});

	fastify.get("/printers/queues", async (request, reply) => {
		let printerMap = printers.map((printer) => ({
			name: printer.name,
			serial: printer.serial,
			current: printer.state.gcode_file,
			state: printer.state.gcode_state,
			progress: printer.state.mc_percent / 100,
			remaining: printer.state.mc_remaining_time,
			queue: printer.queue.getAll(),
		}));

		return {
			success: true,
			printers: printerMap,
		};
	});

	fastify.delete<{
		Params: {
			printerSerial: string;
			queueItemId: number;
		};
	}>("/printers/queues/:printerSerial/:queueItemId", async (request, reply) => {
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
