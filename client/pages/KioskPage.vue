<script>
import { defineComponent } from "vue";
import { mapState, mapActions } from "pinia";
import { ElLoading } from "element-plus";

import { useStore } from "../store";
import RefreshIcon from "../components/RefreshIcon.vue";
import Logo from "../components/Logo.vue";
import GithubCode from "../components/GithubCode.vue";
import PrinterCard from "../components/PrinterCard.vue";

export default defineComponent({
	name: "StudioPage",
	components: {
		RefreshIcon,
		Logo,
		GithubCode,
		PrinterCard,
	},
	data: () => ({
		versionDialogVisible: false,
		gitCommit: import.meta.env.VITE_GIT_COMMIT,
	}),
	computed: {
		...mapState(useStore, ["printers", "currentUpdater"]),
	},
	methods: {
		...mapActions(useStore, ["updatePrinters", "setUpdater"]),
		async manualUpdate() {
			const loading = ElLoading.service({
				lock: true,
				text: "Loading",
				background: "rgba(0, 0, 0, 0.7)",
			});
			await Promise.all([
				this.updatePrinters,
				new Promise((r) => setTimeout(r, 500)),
			]);
			loading.close();
		},
	},
	mounted() {
		this.updatePrinters();
		this.setUpdater(
			setInterval(() => {
				this.updatePrinters();
			}, 5000),
		);
	},
});
</script>

<template>
	<main class="p-4">
		<h1 class="mb-8 text-2xl">Bambu Printer Queues</h1>
		<div class="printer-stack">
			<printer-card
				v-for="printer in printers"
				:key="printer.serial"
				:printer="printer"
			/>
		</div>
	</main>
	<div class="footer">
		<Logo @click="versionDialogVisible = true" style="cursor: pointer" />
	</div>
	<el-dialog v-model="versionDialogVisible" width="30%">
		<div class="flex flex-col items-center gap-3">
			<Logo height="4rem" />
			<span>Version @{{ gitCommit }}</span>
			<span>Created with ❤️ by the HIVE.</span>
			<GithubCode />
		</div>
	</el-dialog>
</template>
