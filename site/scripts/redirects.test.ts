import { deepEqual, equal } from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { PackageInfo } from './packages.ts'
import { documentName, oldPrefix, redirectHtml, redirectsFor } from './redirects.ts'

const cmcd: PackageInfo = {
	folder: 'cmcd',
	name: '@svta/cml-cmcd',
	version: '2.8.3',
	description: 'CMCD',
	group: 'Delivery',
	guides: [{ slug: 'user-guide', title: 'User Guide' }],
}

describe('oldPrefix', () => {
	it('replaces @ and / with underscores', () => {
		equal(oldPrefix('@svta/cml-cmcd'), '_svta_cml-cmcd')
	})
})

describe('documentName', () => {
	it('replaces spaces and slashes with underscores', () => {
		equal(documentName('VSI/EMSG Validation'), 'VSI_EMSG_Validation')
	})
})

describe('redirectsFor', () => {
	it('maps the root pages, the module page, the guides, and the symbols', () => {
		const files = ['index.md', 'cmcd/index.md', 'cmcd/enumerations/CmcdObjectType.md', 'cmcd/type-aliases/Cmcd.md', 'cmcd/functions/encodeCmcd.md']
		deepEqual(redirectsFor([cmcd], files), [
			{ from: 'modules.html', to: '/packages/' },
			{ from: 'hierarchy.html', to: '/api/' },
			{ from: 'modules/_svta_cml-cmcd.html', to: '/api/cmcd/' },
			{ from: 'documents/_svta_cml-cmcd.User_Guide.html', to: '/packages/cmcd/guides/user-guide' },
			{ from: 'enums/_svta_cml-cmcd.CmcdObjectType.html', to: '/api/cmcd/enumerations/CmcdObjectType' },
			{ from: 'types/_svta_cml-cmcd.Cmcd.html', to: '/api/cmcd/type-aliases/Cmcd' },
			{ from: 'functions/_svta_cml-cmcd.encodeCmcd.html', to: '/api/cmcd/functions/encodeCmcd' },
		])
	})

	it('ignores files of packages that are not published', () => {
		deepEqual(redirectsFor([cmcd], ['mse/functions/x.md']).some(r => r.from.includes('mse')), false)
	})
})

describe('redirectHtml', () => {
	it('joins the base path and the target', () => {
		const html = redirectHtml('/api/cmcd/', '/common-media-library/')
		equal(html.includes('content="0; url=/common-media-library/api/cmcd/"'), true)
		equal(html.includes('<link rel="canonical" href="/common-media-library/api/cmcd/">'), true)
		equal(html.includes('<meta name="robots" content="noindex">'), true)
	})
})
