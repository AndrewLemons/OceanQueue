<script>
import { defineComponent } from "vue";

export default defineComponent({
	name: "CurrentPrintCard",
	props: {
		item: {
			type: Object,
			required: true,
		},
	},
});
</script>

<template>
	<el-card>
		<div class="flex flex-row gap-4">
			<div
				class="h-16 w-16 rounded-lg bg-contain bg-no-repeat bg-center bg-zinc-800"
				:style="`background-image: url('data:image/png;base64,${item.metadata?.image}')`"
			></div>
			<div class="flex flex-grow flex-col gap-2">
				<span class="text-lg">{{
					item.fileName?.substring(0, item.fileName?.length - 6)
				}}</span>
				<div class="flex flex-row gap-2 items-center">
					<el-tag>{{ item.state }}</el-tag>
					<el-tag type="info">{{ item.metadata?.layers }} layers</el-tag>
					<el-tag type="info">{{ item.metadata?.printTime }}</el-tag>
				</div>
			</div>
		</div>
	</el-card>
</template>
