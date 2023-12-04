import config from "./config";
import { BambuPrinter } from "./printer";

export const printers: BambuPrinter[] = config.printers.map(
	(c) => new BambuPrinter(c.host, c.serial, c.accessCode, c.name),
);
printers.forEach((printer) => printer.connect());

export default {
	printers,
};
