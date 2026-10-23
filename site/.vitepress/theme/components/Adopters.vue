<script setup>
import adopters from '../../../adopters.json'
</script>

<template>
	<section class="adopters">
		<h2>Who uses CML</h2>
		<p>Players and tools that build on these packages.</p>
		<ul>
			<li v-for="adopter in adopters" :key="adopter.name">
				<a :href="adopter.url" target="_blank" rel="noopener">{{ adopter.name }}</a>
				<span v-if="adopter.packages.length > 0" class="packages">{{ adopter.packages.map(pkg => `cml-${pkg}`).join(', ') }}</span>
				<span v-if="adopter.note" class="note">{{ adopter.note }}</span>
			</li>
		</ul>
	</section>
</template>

<style scoped>
.adopters {
	max-width: 1152px;
	margin: 0 auto;
	padding: 48px 24px 0;
}
h2 {
	font-size: 28px;
	font-weight: 600;
	margin-bottom: 8px;
}
p {
	color: var(--vp-c-text-2);
	margin: 0 0 20px;
}
ul {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
	gap: 16px;
	list-style: none;
	margin: 0;
	padding: 0;
}
.adopters li {
	margin: 0;
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding: 16px 20px;
	border: 1px solid var(--vp-c-divider);
	border-radius: 12px;
	background: var(--vp-c-bg-soft);
}
a {
	font-weight: 600;
	color: var(--vp-c-brand-1);
	text-decoration: none;
}
a:hover {
	text-decoration: underline;
}
.packages,
.note {
	font-size: 13px;
	color: var(--vp-c-text-2);
}
</style>
