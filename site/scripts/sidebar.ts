import type { PackageInfo } from './packages.ts'

// The same shape as VitePress's DefaultTheme.SidebarItem. Declared here so that root `tsc`
// does not load the vitepress type declarations.
export type SidebarItem = {
	text: string
	link?: string
	collapsed?: boolean
	items?: SidebarItem[]
}

export type Sidebar = Record<string, SidebarItem[]>

// The sidebar of one package. `withApi` nests the TypeDoc tree under the API item.
// The tree appears under the /api/<pkg>/ key only, so the shared site data carries it once.
export function packageSidebar(
	pkg: PackageInfo,
	apiSidebar: SidebarItem[],
	withApi: boolean,
): SidebarItem[] {
	const api = withApi ? apiSidebar.find(item => item.link === `/api/${pkg.folder}/`) : undefined
	const items: SidebarItem[] = [{ text: 'Overview', link: `/packages/${pkg.folder}/` }]

	if (pkg.guides.length > 0) {
		items.push({
			text: 'Guides',
			items: pkg.guides.map(guide => ({
				text: guide.title,
				link: `/packages/${pkg.folder}/guides/${guide.slug}`,
			})),
		})
	}

	items.push(
		withApi
			? { text: 'API', link: `/api/${pkg.folder}/`, collapsed: true, items: api?.items ?? [] }
			: { text: 'API', link: `/api/${pkg.folder}/` },
		{ text: 'Changelog', link: `/packages/${pkg.folder}/changelog` },
	)

	return [{ text: pkg.name, items }]
}

// VitePress picks the longest matching key, so package paths win over the section paths.
export function buildSidebar(packages: PackageInfo[], apiSidebar: SidebarItem[]): Sidebar {
	const sorted = [...packages].sort((a, b) => a.folder.localeCompare(b.folder))
	const sidebar: Sidebar = {
		'/guide/': [
			{
				text: 'Guide',
				items: [
					{ text: 'Getting started', link: '/guide/getting-started' },
					{ text: 'CML and coding agents', link: '/guide/llms' },
				],
			},
		],
		'/packages/': [
			{
				text: 'Packages',
				items: sorted.map(pkg => ({ text: pkg.name, link: `/packages/${pkg.folder}/` })),
			},
		],
		'/api/': [
			{
				text: 'API reference',
				items: sorted.map(pkg => ({ text: pkg.name, link: `/api/${pkg.folder}/` })),
			},
		],
		'/releases/': [{ text: 'Releases', items: [{ text: 'All releases', link: '/releases/' }] }],
	}

	for (const pkg of sorted) {
		sidebar[`/packages/${pkg.folder}/`] = packageSidebar(pkg, apiSidebar, false)
		sidebar[`/api/${pkg.folder}/`] = packageSidebar(pkg, apiSidebar, true)
	}

	return sidebar
}
