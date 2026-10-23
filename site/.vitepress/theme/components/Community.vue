<script setup>
const links = [
	{ text: 'Discord', href: 'https://discord.gg/g2c5vwGvUc', detail: 'Ask questions and meet the maintainers.' },
	{ text: 'GitHub Discussions', href: 'https://github.com/streaming-video-technology-alliance/common-media-library/discussions', detail: 'Longer threads and proposals.' },
	{ text: 'SVTA Players and Playback group', href: 'https://www.svta.org/', detail: 'The working group that oversees the project.' },
	{ text: 'Contributing guide', href: 'https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/CONTRIBUTING.md', detail: 'How to report a bug or open a pull request.' },
]
</script>

<template>
	<section class="community">
		<h2>Community</h2>
		<ul>
			<li v-for="link in links" :key="link.href">
				<a :href="link.href" target="_blank" rel="noopener">{{ link.text }}</a>
				<span>{{ link.detail }}</span>
			</li>
		</ul>
	</section>
</template>

<style scoped>
.community {
	max-width: 1152px;
	margin: 0 auto;
	padding: 48px 24px 64px;
}
h2 {
	font-size: 28px;
	font-weight: 600;
	margin-bottom: 20px;
}
ul {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
	gap: 16px;
	list-style: none;
	margin: 0;
	padding: 0;
}
.community li {
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
span {
	font-size: 13px;
	color: var(--vp-c-text-2);
}
</style>
