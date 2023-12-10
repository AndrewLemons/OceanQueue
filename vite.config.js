import { defineConfig } from "vite";
import ChildProcess from "child_process";
import vue from "@vitejs/plugin-vue";

process.env.VITE_GIT_COMMIT = ChildProcess.execSync("git rev-parse HEAD")
	.toString()
	.trim()
	.substring(0, 8);

export default defineConfig({
	plugins: [vue()],
	root: "./client",
	build: {
		outDir: "../dist-client",
		emptyOutDir: true,
	},
});
