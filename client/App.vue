<template>
	<component :is="page"></component>
</template>

<script>
import KioskPage from "./pages/Kiosk.vue";
import StudioPage from "./pages/Studio.vue";

export default {
	components: {
		KioskPage,
		StudioPage,
	},
	computed: {
		page() {
			return window.location.pathname === "/kiosk" ? KioskPage : StudioPage;
		},
	},
};
</script>
