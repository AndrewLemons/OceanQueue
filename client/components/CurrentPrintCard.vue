<script>
import { defineComponent } from "vue";

export default defineComponent({
	name: "CurrentPrintCard",
	props: {
		item: {
			type: Object,
			required: true,
		},
	},
	computed: {
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
	},
});
</script>

<template>
	<el-card>
		<template #header>
			<div class="flex flex-row gap-2 items-center">
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
			</div>
		</template>
		<div class="flex flex-col gap-4" v-if="item.fileName">
			<span class="text-lg">{{
				item.fileName.substring(0, item.fileName.length - 6)
			}}</span>
			<div
				class="w-full h-32 rounded-lg bg-contain bg-no-repeat bg-center bg-zinc-800"
				:style="`background-image: url('data:image/png;base64,${item.metadata.image}')`"
			></div>
		</div>
		<div v-else>
			<span>Waiting for a print. Queue a print from BambuStudio.</span>
		</div>
	</el-card>
</template>
