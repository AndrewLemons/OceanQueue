<template>
	<el-container>
		<el-main>
			<el-row>
				<h1>Printer Queues</h1>
			</el-row>
			<el-row style="margin-bottom: 1rem">
				<el-button type="primary" @click="manualUpdate">
					<RefreshIcon />
					<span>Refresh</span>
				</el-button>
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
								@removeQueueItem="removeQueueItem"
							/>
						</el-timeline-item>
					</el-timeline>
					<span v-if="printer.queue.length == 0">No jobs in queue</span>
				</el-card>
			</div>
		</el-main>
	</el-container>
	<div class="footer">
		<Logo @click="versionDialogVisible = true" style="cursor: pointer" />
	</div>
	<el-dialog v-model="versionDialogVisible" width="30%">
		<div class="dialog">
			<Logo height="4rem" />
			<span>Version @{{ gitCommit }}</span>
			<span>Created with ❤️ by the HIVE.</span>
			<GithubCode />
		</div>
	</el-dialog>
</template>

<style scoped>
.dialog {
	display: flex;
	flex-direction: column;
	align-items: center;
}
</style>

<script>
import { ElLoading } from "element-plus";

import RefreshIcon from "../components/RefreshIcon.vue";
import Logo from "../components/Logo.vue";
import QueueItem from "../components/QueueItem.vue";
import GithubCode from "../components/GithubCode.vue";

const gitCommit = import.meta.env.VITE_GIT_COMMIT;

export default {
	components: {
		RefreshIcon,
		Logo,
		QueueItem,
		GithubCode,
	},
	data() {
		return {
			printers: [],
			RefreshIcon,
			gitCommit,
			versionDialogVisible: false,
		};
	},
	methods: {
		async load() {
			const response = await fetch("/oceanqueue/printers/queues");
			const data = await response.json();
			if (data.success == false) return;
			this.printers = data.printers;
		},
		async manualUpdate() {
			const loading = ElLoading.service({
				lock: true,
				text: "Loading",
				background: "rgba(0, 0, 0, 0.7)",
			});
			await Promise.all([this.load, new Promise((r) => setTimeout(r, 500))]);
			loading.close();
		},
		update() {
			this.load();
			setTimeout(this.update, 5000);
		},
		async removeQueueItem(printerId, itemId) {
			const loading = ElLoading.service({
				lock: true,
				text: "Loading",
				background: "rgba(0, 0, 0, 0.7)",
			});
			await fetch(`/oceanqueue/printers/queues/${printerId}/${itemId}`, {
				method: "DELETE",
			});
			loading.close();
			await this.manualUpdate();
		},
	},
	mounted() {
		this.update();
	},
};
</script>
