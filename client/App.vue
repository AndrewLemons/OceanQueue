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
							<div class="space-between">
								<div>
									<div class="mb-2">{{ item.fileName }}</div>
									<div v-if="item.state === 'sent'">
										<el-tag class="mr-2">{{ item.state }}</el-tag>
									</div>
									<div v-if="item.state === 'printing'">
										<el-tag class="mr-2">{{ item.state }}</el-tag>
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
								<el-button
									link
									type="danger"
									@click="() => removeQueueItem(printer.serial, item.id)"
								>
									Remove
								</el-button>
							</div>
						</el-timeline-item>
					</el-timeline>
					<span v-if="printer.queue.length == 0">No jobs in queue</span>
				</el-card>
			</div>
		</el-main>
	</el-container>
	<div class="footer">
		<Logo />
	</div>
</template>

<script>
import { ElLoading } from "element-plus";

import RefreshIcon from "./components/RefreshIcon.vue";
import Logo from "./components/Logo.vue";

export default {
	components: {
		RefreshIcon,
		Logo,
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
