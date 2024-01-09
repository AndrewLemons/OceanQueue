<script>
import { defineComponent } from "vue";

export default defineComponent({
	name: "Printer",
	props: {
		printer: {
			type: Object,
			required: true,
		},
	},
});
</script>

<template>
	<el-card>
		<template #header>
			<div>
				<span>{{ printer.name }}</span>
				<el-tag
					>{{ printer.queue.length }} print{{
						printer.queue.length != 1 ? "s" : ""
					}}</el-tag
				>
			</div>
		</template>
		<el-timeline>
			<el-timeline-item
				v-for="(item, index) in printer.queue"
				:key="index"
				:type="index == 0 ? 'primary' : undefined"
			>
				<QueueItem
					:printer="printer"
					:item="item"
					@removeQueueItem="removeQueueItem"
				/>
			</el-timeline-item>
		</el-timeline>
		<span v-if="printer.queue.length == 0">No jobs in queue</span>
	</el-card>
</template>
