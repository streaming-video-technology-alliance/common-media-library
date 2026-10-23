import { equal } from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { PackageInfo } from './packages.ts'
import { renderPeers } from './peers.ts'

const base: PackageInfo = { folder: 'cmcd', name: '@svta/cml-cmcd', version: '2.0.0', description: 'CMCD', group: 'Delivery', guides: [], peers: [] }

describe('renderPeers', () => {
	it('returns nothing for a package without peers', () => {
		equal(renderPeers(base), '')
	})

	it('renders one link per peer', () => {
		const text = renderPeers({ ...base, peers: ['structured-field-values', 'utils'] })
		equal(text.startsWith('\n## Peer dependencies\n'), true)
		equal(text.includes('- [@svta/cml-structured-field-values](/packages/structured-field-values/)\n'), true)
		equal(text.includes('- [@svta/cml-utils](/packages/utils/)\n'), true)
	})
})
