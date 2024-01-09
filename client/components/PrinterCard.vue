<script>
import { defineComponent } from "vue";

export default defineComponent({
	name: "PrinterCard",
	props: {
		printer: {
			type: Object,
			required: true,
		},
	},
	computed: {
		item() {
			return this.printer.firstQueueItem ?? {};
		},
		percentage() {
			return this.item.progress;
		},
		type() {
			switch (this.item.state) {
				case "sending":
					return "primary";
				case "printing":
					return "primary";
				case "failed":
					return "danger";
				default:
					return "warning";
			}
		},
		progressBarStatus() {
			switch (this.item.state) {
				case "sending":
					return "";
				case "printing":
					return "";
				case "failed":
					return "exception";
				default:
					return "warning";
			}
		},
		progressBarStriped() {
			switch (this.item.state) {
				case "sending":
					return true;
				case "printing":
					return false;
				case "failed":
					return false;
				default:
					return true;
			}
		},
		progressBarPercentage() {
			switch (this.item.state) {
				case "sending":
					return 100;
				case "printing":
					return this.percentage;
				case "failed":
					return 100;
				default:
					return 0;
			}
		},
		timeRemaining() {
			// Convert seconds to hh:mm
			const seconds = this.item.remaining;
			const hours = Math.floor(seconds / 3600);
			const minutes = Math.floor((seconds - hours * 3600) / 60);
			return `${hours.toFixed(0)}:${minutes.toFixed(0).padStart(2, "0")}`;
		},
	},
});
</script>

<template>
	<el-card>
		<template #header>
			<div class="flex flex-row justify-between">
				<span class="text-lg">{{ printer.name }}</span>
				<el-tag type="info">{{ printer.queueSize }} prints</el-tag>
			</div>
		</template>
		<div class="flex flex-row gap-4 items-center" v-if="item.fileName">
			<div
				class="w-24 h-24 rounded-lg bg-contain bg-no-repeat bg-center bg-zinc-800"
				:style="`background-image: url('data:image/png;base64,${item.metadata?.image}')`"
			></div>
			<div class="flex flex-col gap-4 flex-grow justify-center">
				<span class="text-lg">{{
					item.fileName?.substring(0, item.fileName?.length - 6)
				}}</span>
				<div class="flex flex-row gap-2">
					<el-tag :type="type">{{ item.state ?? "idle" }}</el-tag>
					<div class="flex-grow">
						<el-progress
							:percentage="progressBarPercentage"
							:stroke-width="20"
							:status="progressBarStatus"
							:striped="progressBarStriped"
							:striped-flow="progressBarStriped"
							:show-text="!progressBarStriped"
							:duration="10"
							text-inside
						/>
					</div>
					<el-tag type="info" v-if="item.state === 'printing'">{{
						timeRemaining
					}}</el-tag>
				</div>
			</div>
		</div>
		<div class="flex flex-col gap-4" v-else>
			<span>Waiting for a print.</span>
			<el-tag :type="type">{{ item.state ?? "idle" }}</el-tag>
		</div>
	</el-card>
</template>
