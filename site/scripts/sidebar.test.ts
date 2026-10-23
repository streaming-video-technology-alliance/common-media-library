import { deepEqual, equal } from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { PackageInfo } from './packages.ts'
import { buildSidebar, packageSidebar, type SidebarItem } from './sidebar.ts'

const utils: PackageInfo = { folder: 'utils', name: '@svta/cml-utils', version: '1.0.0', description: 'Utilities', group: 'Core', guides: [], peers: [] }
const cmcd: PackageInfo = {
	folder: 'cmcd',
	name: '@svta/cml-cmcd',
	version: '2.0.0',
	description: 'CMCD',
	group: 'Delivery',
	guides: [{ slug: 'user-guide', title: 'User Guide' }],
	peers: [],
}
const apiSidebar: SidebarItem[] = [
	{ text: 'cmcd', link: '/api/cmcd/', collapsed: true, items: [{ text: 'Functions', items: [{ text: 'encodeCmcd', link: '/api/cmcd/functions/encodeCmcd.md' }] }] },
	{ text: 'utils', link: '/api/utils/', collapsed: true, items: [] },
]

describe('packageSidebar', () => {
	it('lists Overview, API, and Changelog for a package without guides', () => {
		deepEqual(packageSidebar(utils, apiSidebar, false), [{
			text: '@svta/cml-utils',
			items: [
				{ text: 'Overview', link: '/packages/utils/' },
				{ text: 'API', link: '/api/utils/' },
				{ text: 'Changelog', link: '/packages/utils/changelog' },
			],
		}])
	})

	it('adds a Guides group when the package has guides', () => {
		const [group] = packageSidebar(cmcd, apiSidebar, false)
		deepEqual(group.items?.[1], { text: 'Guides', items: [{ text: 'User Guide', link: '/packages/cmcd/guides/user-guide' }] })
	})

	it('nests the API tree only when asked', () => {
		const withoutApi = packageSidebar(cmcd, apiSidebar, false)[0].items?.find(item => item.text === 'API')
		const withApi = packageSidebar(cmcd, apiSidebar, true)[0].items?.find(item => item.text === 'API')
		equal(withoutApi?.items, undefined)
		deepEqual(withApi, { text: 'API', link: '/api/cmcd/', collapsed: true, items: apiSidebar[0].items })
	})
})

describe('buildSidebar', () => {
	const sidebar = buildSidebar([utils, cmcd], apiSidebar)

	it('has the four section keys and two keys per package', () => {
		deepEqual(Object.keys(sidebar).sort(), ['/api/', '/api/cmcd/', '/api/utils/', '/guide/', '/packages/', '/packages/cmcd/', '/packages/utils/', '/releases/'])
	})

	it('sorts the section lists by folder', () => {
		deepEqual(sidebar['/packages/'][0].items?.map(item => item.link), ['/packages/cmcd/', '/packages/utils/'])
		deepEqual(sidebar['/api/'][0].items?.map(item => item.link), ['/api/cmcd/', '/api/utils/'])
	})

	it('puts the API tree under the api key only', () => {
		const packageApi = sidebar['/packages/cmcd/'][0].items?.find(item => item.text === 'API')
		const apiApi = sidebar['/api/cmcd/'][0].items?.find(item => item.text === 'API')
		equal(packageApi?.items, undefined)
		equal(apiApi?.items?.length, 1)
	})

	it('does not change the order of the input', () => {
		const input = [utils, cmcd]
		buildSidebar(input, apiSidebar)
		deepEqual(input.map(pkg => pkg.folder), ['utils', 'cmcd'])
	})
})
