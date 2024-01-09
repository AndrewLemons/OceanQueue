import { defineStore } from "pinia";

export const useStore = defineStore("main", {
	state: () => ({
		printers: [],
		currentUpdater: null,
	}),
	actions: {
		async updatePrinters() {
			console.log("Updating printers");
			const request = await fetch("/oceanqueue/printers");
			const response = await request.json();
			this.printers = response.printers;
		},
		async updatePrinter(serial) {
			console.log("Updating printer " + serial);
			const request = await fetch("/oceanqueue/printers/" + serial);
			const response = await request.json();
			const index = this.printers.findIndex(
				(printer) => printer.serial === serial,
			);
			if (index === -1) {
				this.printers.push(response.printer);
			} else {
				this.printers[index] = response.printer;
			}
		},
		setUpdater(updater) {
			clearInterval(this.currentUpdater);
			this.currentUpdater = updater;
		},
	},
});
