<script>
import { defineComponent } from "vue";
import { mapState, mapActions } from "pinia";
import { useStore } from "../store";

import CurrentPrintCard from "../components/CurrentPrintCard.vue";
import PrintCard from "../components/PrintCard.vue";

export default defineComponent({
	name: "PrinterPage",
	components: {
		CurrentPrintCard,
		PrintCard,
	},
	computed: {
		...mapState(useStore, ["printers", "currentUpdater"]),
		printerSerial() {
			return this.$route.params.serial;
		},
		printer() {
			return this.printers.find((p) => p.serial == this.printerSerial) ?? {};
		},
		currentPrint() {
			return this.printer.queue?.[0] ?? {};
		},
		queue() {
			return this.printer.queue?.splice(1) ?? [];
		},
	},
	methods: {
		...mapActions(useStore, ["updatePrinter", "setUpdater"]),
		goBack() {
			this.$router.push("/");
		},
	},
	mounted() {
		this.updatePrinter(this.printerSerial);
		this.setUpdater(
			setInterval(() => {
				this.updatePrinter(this.printerSerial);
			}, 5000),
		);
	},
});
</script>

<template>
	<el-page-header @back="goBack" class="p-4">
		<template #content>
			<span class="text-large font-600 mr-3">
				{{ printer.name ?? "Unknown" }}
			</span>
		</template>
		<div class="flex flex-col lg:flex-row pt-4 gap-10">
			<div class="w-full lg:w-1/3">
				<current-print-card :item="currentPrint" />
			</div>
			<div class="w-full lg:w-2/3 flex flex-col gap-4">
				<span class="text-2xl">Queue</span>
				<el-timeline center>
					<el-timeline-item
						center
						v-for="(item, index) in queue ?? []"
						:key="index"
					>
						<print-card :item="item" />
					</el-timeline-item>
					<el-timeline-item v-if="queue.length > 0">
						<el-tag type="danger">END OF QUEUE</el-tag>
					</el-timeline-item>
				</el-timeline>
				<el-empty v-if="queue.length === 0" description="No prints in queue" />
			</div>
		</div>
	</el-page-header>
</template>
