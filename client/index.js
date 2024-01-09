import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";
import "./scss/main.scss";

import ElementPlus from "element-plus";

const app = createApp(App);
const pinia = createPinia();

app.use(ElementPlus).use(router).use(pinia).mount("#app");
