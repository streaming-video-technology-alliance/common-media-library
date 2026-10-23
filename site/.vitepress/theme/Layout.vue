<script setup>
import DefaultTheme from 'vitepress/theme'
import { withBase } from 'vitepress'
</script>

<template>
	<DefaultTheme.Layout>
		<template #not-found>
			<div class="not-found">
				<img :src="withBase('/cml-mark.svg')" alt="" width="96" height="96">
				<h1>Page not found</h1>
				<p>The address has no page. Search for a package name, or browse the packages.</p>
				<a :href="withBase('/packages/')">Browse the packages</a>
			</div>
		</template>
	</DefaultTheme.Layout>
</template>

<style scoped>
.not-found {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16px;
	padding: 96px 24px;
	text-align: center;
}
.not-found h1 {
	font-size: 32px;
	font-weight: 600;
}
.not-found p {
	max-width: 480px;
	color: var(--vp-c-text-2);
}
.not-found a {
	padding: 8px 20px;
	border-radius: 20px;
	background: var(--vp-button-brand-bg);
	color: var(--vp-button-brand-text);
	font-weight: 600;
	text-decoration: none;
}
.not-found a:hover {
	background: var(--vp-button-brand-hover-bg);
}
</style>
