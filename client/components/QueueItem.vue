<template>
	<div class="space-between">
		<div class="vertical-stack">
			<div class="mb-2">{{ item.fileName }}</div>
			<div class="horizontal-stack">
				<Spinner class="mr-2" v-if="item.state === 'sending'" />
				<div v-if="item.state !== 'queued'">
					<el-tag class="mr-2">{{ item.state }}</el-tag>
				</div>
				<div v-if="item.state === 'printing'">
					<el-tag class="mr-2" type="info"
						>{{ Math.floor(printer.progress * 100) }}%</el-tag
					>
					<el-tag class="mr-2" type="info">{{
						// Minutes to hh:mm
						Math.floor(printer.remaining / 60)
							.toString()
							.padStart(2, "0") +
						":" +
						Math.floor(printer.remaining % 60)
							.toString()
							.padStart(2, "0")
					}}</el-tag>
				</div>
			</div>
		</div>
		<el-button
			v-if="canRemove && item.state !== 'printing' && item.state !== 'sending'"
			link
			type="danger"
			@click="() => removeQueueItem(printer.serial, item.id)"
		>
			Remove
		</el-button>
	</div>
</template>

<style>
.horizontal-stack {
	display: flex;
	flex-direction: row;
	align-items: center;
}

.vertical-stack {
	display: flex;
	flex-direction: column;
}
</style>

<script>
import Spinner from "./Spinner.vue";

export default {
	name: "QueueItem",
	components: {
		Spinner,
	},
	props: {
		printer: Object,
		item: Object,
		canRemove: {
			type: Boolean,
			default: true,
		},
	},
	methods: {
		removeQueueItem(serial, id) {
			this.$emit("removeQueueItem", serial, id);
		},
	},
};
</script>
