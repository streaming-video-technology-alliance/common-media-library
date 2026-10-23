import { deepEqual, equal, ok } from 'node:assert/strict'
import { describe, it } from 'node:test'
import { runInNewContext } from 'node:vm'
import type { PackageInfo } from './packages.ts'
import {
	documentAnchors,
	documentName,
	oldPrefix,
	redirectHtml,
	redirectsFor,
	type Redirect,
} from './redirects.ts'

const cmcd: PackageInfo = {
	folder: 'cmcd',
	name: '@svta/cml-cmcd',
	version: '2.8.3',
	description: 'CMCD',
	group: 'Delivery',
	guides: [{ slug: 'user-guide', title: 'User Guide' }],
	peers: [],
}

const base = '/common-media-library/'
const symbol: Redirect = {
	from: 'classes/_svta_cml-cmcd.CmcdReporter.html',
	to: '/api/cmcd/classes/CmcdReporter',
	signatures: true,
}
const guide: Redirect = {
	from: 'documents/_svta_cml-cmcd.User_Guide.html',
	to: '/packages/cmcd/guides/user-guide',
	anchors: { '-snapshot': 'getreports-snapshot' },
}

// Runs the stub script against a fake `location` and returns the URL it navigates to.
function follow(redirect: Redirect, hash: string): string {
	const html = redirectHtml(redirect, base)
	const open = '<script>'
	const start = html.indexOf(open)
	const end = html.indexOf('</script>')
	ok(start >= 0 && end > start, 'the stub has a script')
	const script = html.slice(start + open.length, end)
	const location = {
		hash,
		href: '',
		replace(url: string) {
			location.href = url
		},
	}
	runInNewContext(script, { location })
	return location.href
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
		const files = [
			'index.md',
			'cmcd/index.md',
			'cmcd/classes/CmcdReporter.md',
			'cmcd/enumerations/CmcdObjectType.md',
			'cmcd/type-aliases/Cmcd.md',
			'cmcd/functions/encodeCmcd.md',
		]
		deepEqual(redirectsFor([cmcd], files), [
			{ from: 'modules.html', to: '/packages/' },
			{ from: 'hierarchy.html', to: '/api/' },
			{ from: 'modules/_svta_cml-cmcd.html', to: '/api/cmcd/' },
			{
				from: 'documents/_svta_cml-cmcd.User_Guide.html',
				to: '/packages/cmcd/guides/user-guide',
				anchors: documentAnchors['documents/_svta_cml-cmcd.User_Guide.html'],
			},
			{
				from: 'classes/_svta_cml-cmcd.CmcdReporter.html',
				to: '/api/cmcd/classes/CmcdReporter',
				signatures: true,
			},
			{
				from: 'enums/_svta_cml-cmcd.CmcdObjectType.html',
				to: '/api/cmcd/enumerations/CmcdObjectType',
			},
			{
				from: 'types/_svta_cml-cmcd.Cmcd.html',
				to: '/api/cmcd/type-aliases/Cmcd',
				signatures: true,
			},
			{ from: 'functions/_svta_cml-cmcd.encodeCmcd.html', to: '/api/cmcd/functions/encodeCmcd' },
		])
	})

	it('omits the anchor list from guides that are not in it', () => {
		const other: PackageInfo = { ...cmcd, guides: [{ slug: 'other', title: 'Other' }] }
		deepEqual(redirectsFor([other], []).at(-1), {
			from: 'documents/_svta_cml-cmcd.Other.html',
			to: '/packages/cmcd/guides/other',
		})
	})

	it('ignores files of packages that are not published', () => {
		deepEqual(
			redirectsFor([cmcd], ['mse/functions/x.md']).some(r => r.from.includes('mse')),
			false,
		)
	})
})

describe('redirectHtml', () => {
	it('joins the base path and the target', () => {
		const html = redirectHtml({ from: 'modules/_svta_cml-cmcd.html', to: '/api/cmcd/' }, base)
		equal(html.includes('content="0; url=/common-media-library/api/cmcd/"'), true)
		equal(html.includes('<link rel="canonical" href="/common-media-library/api/cmcd/">'), true)
		equal(html.includes('<meta name="robots" content="noindex">'), true)
	})

	it('preserves the fragment', () => {
		equal(
			follow(symbol, '#recordevent'),
			'/common-media-library/api/cmcd/classes/CmcdReporter#recordevent',
		)
	})

	it('adds no separator when the URL has no fragment', () => {
		equal(follow(symbol, ''), '/common-media-library/api/cmcd/classes/CmcdReporter')
	})

	it('maps a signature anchor to its member on a symbol page', () => {
		equal(
			follow(symbol, '#recordevent-1'),
			'/common-media-library/api/cmcd/classes/CmcdReporter#recordevent',
		)
	})

	it('keeps a numbered heading anchor on a guide page', () => {
		equal(
			follow(guide, '#basic-usage-1'),
			'/common-media-library/packages/cmcd/guides/user-guide#basic-usage-1',
		)
	})

	it('rewrites underscores to hyphens', () => {
		equal(
			follow(symbol, '#timed_text'),
			'/common-media-library/api/cmcd/classes/CmcdReporter#timed-text',
		)
	})

	it('applies the anchor list before the rewrite', () => {
		equal(
			follow(guide, '#-snapshot'),
			'/common-media-library/packages/cmcd/guides/user-guide#getreports-snapshot',
		)
	})
})
