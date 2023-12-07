<template>
	<el-container>
		<el-main>
			<el-row>
				<h1>Bambu Printer Queues</h1>
			</el-row>
			<div class="printer-stack">
				<el-card class="box-card printer-card" v-for="printer in printers">
					<template #header>
						<div class="card-header">
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
								:canRemove="false"
								@removeQueueItem="removeQueueItem"
							/>
						</el-timeline-item>
					</el-timeline>
					<span v-if="printer.queue.length == 0">No jobs in queue</span>
				</el-card>
			</div>
		</el-main>
	</el-container>
</template>

<script>
import { ElLoading } from "element-plus";

import RefreshIcon from "../components/RefreshIcon.vue";
import Logo from "../components/Logo.vue";
import QueueItem from "../components/QueueItem.vue";

export default {
	components: {
		RefreshIcon,
		Logo,
		QueueItem,
	},
	data() {
		return {
			printers: [],
			RefreshIcon,
		};
	},
	methods: {
		async load() {
			const response = await fetch("/oceanqueue/printers/queues");
			const data = await response.json();
			if (data.success == false) return;
			this.printers = data.printers;
		},
		update() {
			this.load();
			setTimeout(this.update, 5000);
		},
	},
	mounted() {
		this.update();
	},
};
</script>
