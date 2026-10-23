<script setup>
import { withBase } from 'vitepress'
import { groupOrder } from '../../../scripts/groups.ts'
import packages from '../../../packages/packages.json'

const groups = groupOrder
	.map(group => ({
		group,
		items: packages
			.filter(pkg => pkg.group === group)
			.sort((a, b) => a.folder.localeCompare(b.folder)),
	}))
	.filter(entry => entry.items.length > 0)
</script>

<template>
	<section class="package-grid">
		<h2>Packages</h2>
		<div v-for="entry in groups" :key="entry.group" class="group">
			<h3>{{ entry.group }}</h3>
			<ul role="list">
				<li v-for="pkg in entry.items" :key="pkg.folder">
					<a :href="withBase(`/packages/${pkg.folder}/`)">
						<span class="name">{{ pkg.name }}</span>
						<span class="version">{{ pkg.version }}</span>
						<span class="description">{{ pkg.description }}</span>
					</a>
				</li>
			</ul>
		</div>
	</section>
</template>

<style scoped>
.package-grid {
	max-width: 1152px;
	margin: 0 auto;
	padding: 48px 0 0;
}
.package-grid h2 {
	font-size: 28px;
	font-weight: 600;
	margin-bottom: 8px;
}
.package-grid h3 {
	font-size: 14px;
	font-weight: 600;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	color: var(--vp-c-text-2);
	margin: 32px 0 12px;
}
.package-grid ul {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
	gap: 16px;
	list-style: none;
	margin: 0;
	padding: 0;
}
.package-grid li {
	margin: 0;
}
.package-grid a {
	display: flex;
	flex-direction: column;
	gap: 6px;
	height: 100%;
	padding: 20px;
	border: 1px solid var(--vp-c-divider);
	border-radius: 12px;
	background: var(--vp-c-bg-soft);
	color: var(--vp-c-text-1);
	text-decoration: none;
	transition: border-color 0.2s;
}
.package-grid a:hover {
	border-color: var(--vp-c-brand-1);
}
.name {
	font-weight: 600;
}
.version {
	font-size: 12px;
	color: var(--vp-c-text-2);
}
.description {
	font-size: 14px;
	color: var(--vp-c-text-2);
}
</style>
