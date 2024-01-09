import { createRouter, createWebHashHistory } from "vue-router";

import StudioPage from "./pages/StudioPage.vue";
import KioskPage from "./pages/KioskPage.vue";
import PrinterPage from "./pages/PrinterPage.vue";

const router = createRouter({
	history: createWebHashHistory(),
	routes: [
		{ path: "/", component: StudioPage },
		{ path: "/kiosk", component: KioskPage },
		{ path: "/printers/:serial", component: PrinterPage },
	],
});

export default router;
