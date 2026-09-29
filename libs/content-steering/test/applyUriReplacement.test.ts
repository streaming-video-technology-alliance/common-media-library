import { applyUriReplacement } from '@svta/cml-content-steering'
import { equal, throws } from 'node:assert'
import { describe, it } from 'node:test'

describe('applyUriReplacement', () => {
	it('provides a valid example', () => {
		//#region example
		const replacement = { HOST: 'backup2.example.com', PARAMS: { token: 'dkfs1239414' } }

		const uri = applyUriReplacement('https://example.com/some/path/to/file', replacement)

		equal(uri, 'https://backup2.example.com/some/path/to/file?token=dkfs1239414')
		//#endregion example
	})

	it('gives the same host to URIs with different hosts', () => {
		const replacement = { HOST: 'backup2.example.com', PARAMS: { token: 'dkfs1239414' } }

		equal(applyUriReplacement('https://b.example.com/another/path', replacement), 'https://backup2.example.com/another/path?token=dkfs1239414')
	})

	it('keeps the port when it replaces the hostname', () => {
		equal(applyUriReplacement('https://a.example.com:8443/x.m3u8', { HOST: 'b.example.com' }), 'https://b.example.com:8443/x.m3u8')
	})

	it('accepts an IPv6 address as HOST', () => {
		equal(applyUriReplacement('https://a.example.com/x', { HOST: '[2001:db8::1]' }), 'https://[2001:db8::1]/x')
	})

	it('resolves a relative URI against baseUri', () => {
		const uri = applyUriReplacement('seg/1.m4s', { HOST: 'b.example.com' }, { baseUri: 'https://a.example.com/video/main.mpd' })

		equal(uri, 'https://b.example.com/video/seg/1.m4s')
	})

	it('returns the resolved URI for an empty replacement', () => {
		equal(applyUriReplacement('1.m4s', {}, { baseUri: 'https://a.example.com/v/' }), 'https://a.example.com/v/1.m4s')
	})

	it('replaces a query parameter of the same name at its position', () => {
		const uri = applyUriReplacement('https://a.example.com/x?a=1&token=old&b=2', { PARAMS: { token: 'new' } })

		equal(uri, 'https://a.example.com/x?a=1&token=new&b=2')
	})

	it('removes later parameters of the same name', () => {
		equal(applyUriReplacement('https://a.example.com/x?token=1&token=2', { PARAMS: { token: '3' } }), 'https://a.example.com/x?token=3')
	})

	it('appends new parameters in code point order', () => {
		const uri = applyUriReplacement('https://a.example.com/x?z=0', { PARAMS: { b: '2', a: '1', B: '3' } })

		equal(uri, 'https://a.example.com/x?z=0&B=3&a=1&b=2')
	})

	it('does not encode percent-encoded values again', () => {
		equal(applyUriReplacement('https://a.example.com/x', { PARAMS: { token: 'a%2Fb%20c' } }), 'https://a.example.com/x?token=a%2Fb%20c')
	})

	it('keeps the existing query unchanged', () => {
		const uri = applyUriReplacement('https://a.example.com/x?q=a%20b&r=%2F', { PARAMS: { t: '1' } })

		equal(uri, 'https://a.example.com/x?q=a%20b&r=%2F&t=1')
	})

	it('ignores a parameter with an empty name', () => {
		equal(applyUriReplacement('https://a.example.com/x', { PARAMS: { '': '1', a: '2' } }), 'https://a.example.com/x?a=2')
	})

	it('keeps the fragment', () => {
		equal(applyUriReplacement('https://a.example.com/x#t=10', { PARAMS: { a: '1' } }), 'https://a.example.com/x?a=1#t=10')
	})

	describe('HLS stable IDs', () => {
		const replacement = {
			HOST: 'cdn-c.example.com',
			PARAMS: { token: 'abc' },
			'PER-VARIANT-URIS': { 'hd-1080': 'https://cdn-d.example.com/hd/1080.m3u8' },
			'PER-RENDITION-URIS': { 'audio-en': 'https://cdn-d.example.com/audio/en.m3u8' },
		}
		const baseUri = 'https://cdn-a.example.com/main.m3u8'

		it('returns the per-variant URI without HOST and PARAMS', () => {
			const uri = applyUriReplacement('hd/1080.m3u8', replacement, { baseUri, stableVariantId: 'hd-1080' })

			equal(uri, 'https://cdn-d.example.com/hd/1080.m3u8')
		})

		it('returns the per-rendition URI without HOST and PARAMS', () => {
			const uri = applyUriReplacement('audio/en.m3u8', replacement, { baseUri, stableRenditionId: 'audio-en' })

			equal(uri, 'https://cdn-d.example.com/audio/en.m3u8')
		})

		it('applies HOST and PARAMS when the stable ID has no entry', () => {
			const uri = applyUriReplacement('sd/540.m3u8', replacement, { baseUri, stableVariantId: 'sd-540' })

			equal(uri, 'https://cdn-c.example.com/sd/540.m3u8?token=abc')
		})

		it('ignores the name of an inherited property as a stable ID', () => {
			const uri = applyUriReplacement('sd/540.m3u8', replacement, { baseUri, stableVariantId: 'constructor' })

			equal(uri, 'https://cdn-c.example.com/sd/540.m3u8?token=abc')
		})

		it('applies HOST and PARAMS when PER-VARIANT-URIS is a string', () => {
			const bad = { ...replacement, 'PER-VARIANT-URIS': 'abc' }
			// @ts-expect-error - a server value that is not an object
			const uri = applyUriReplacement('sd/540.m3u8', bad, { baseUri, stableVariantId: '0' })

			equal(uri, 'https://cdn-c.example.com/sd/540.m3u8?token=abc')
		})

		it('applies HOST and PARAMS when PER-VARIANT-URIS is an array', () => {
			const bad = { ...replacement, 'PER-VARIANT-URIS': ['https://cdn-d.example.com/x'] }
			// @ts-expect-error - a server value that is not an object
			const uri = applyUriReplacement('sd/540.m3u8', bad, { baseUri, stableVariantId: '0' })

			equal(uri, 'https://cdn-c.example.com/sd/540.m3u8?token=abc')
		})

		it('applies HOST and PARAMS when the per-variant value is a relative URI', () => {
			const relative = { ...replacement, 'PER-VARIANT-URIS': { 'hd-1080': 'hd/1080.m3u8' } }
			const uri = applyUriReplacement('hd/1080.m3u8', relative, { baseUri, stableVariantId: 'hd-1080' })

			equal(uri, 'https://cdn-c.example.com/hd/1080.m3u8?token=abc')
		})
	})

	describe('errors', () => {
		it('throws when uri is relative and baseUri is absent', () => {
			throws(() => applyUriReplacement('x/1.m4s', { HOST: 'b.example.com' }), { name: 'TypeError', message: /uri/ })
		})

		it('throws when HOST has a port', () => {
			throws(() => applyUriReplacement('https://a.example.com/x', { HOST: 'b.example.com:9000' }), { name: 'TypeError', message: /HOST/ })
		})

		it('throws when HOST is empty', () => {
			throws(() => applyUriReplacement('https://a.example.com/x', { HOST: '' }), { name: 'TypeError', message: /HOST/ })
		})

		it('throws when HOST has a path', () => {
			throws(() => applyUriReplacement('https://a.example.com/x', { HOST: 'b.example.com/y' }), { name: 'TypeError', message: /HOST/ })
		})
	})
})
