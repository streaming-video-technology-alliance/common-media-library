import { getBaseUrl, urlToRelativePath } from '@svta/cml-utils'
import { equal } from 'node:assert'
import { describe, it } from 'node:test'

describe('urlToRelativePath', () => {
	it('produces a relative path when at root', () => {
		equal(urlToRelativePath('http://test.com/1.mp4', 'http://test.com/manifest.mpd'), '1.mp4')
	})

	it('produces a relative path when at the same folder level', () => {
		equal(urlToRelativePath('http://test.com/base/1.mp4', 'http://test.com/base/manifest.mpd'), '1.mp4')
	})

	it('produces a relative path when base is lower', () => {
		equal(urlToRelativePath('http://test.com/base/segments/video/1.mp4', 'http://test.com/manifest.mpd'), 'base/segments/video/1.mp4')
	})

	it('produces a relative path when base is higher', () => {
		equal(urlToRelativePath('http://test.com/1.mp4', 'http://test.com/base/manifest/manifest.mpd'), '../../1.mp4')
	})

	it('produces a relative path when base and url are different', () => {
		//#region example
		equal(urlToRelativePath('http://test.com/base/segments/video/1.mp4', 'http://test.com/base/manifest/manifest.mpd'), '../segments/video/1.mp4')
		//#endregion example
	})

	it('returns url when origins are different', () => {
		equal(urlToRelativePath('http://foo.com/1.mp4', 'http://test.com/base/manifest/manifest.mpd'), 'http://foo.com/1.mp4')
	})

	it('returns url unchanged when it is already a relative path', () => {
		equal(urlToRelativePath('1.mp4', 'http://test.com/base/manifest/manifest.mpd'), '1.mp4')
		equal(urlToRelativePath('../segments/1.mp4', 'http://test.com/base/manifest/manifest.mpd'), '../segments/1.mp4')
	})

	it('maintains query parameters and hash in the relative path', () => {
		equal(urlToRelativePath('http://test.com/base/segments/video/1.mp4?param=foo&another=bar#hash=baz', 'http://test.com/base/manifest/manifest.mpd'), '../segments/video/1.mp4?param=foo&another=bar#hash=baz')
	})

	it('produces a relative path when only query params are different', () => {
		equal(urlToRelativePath('http://test.com/file.mp4?i=1', 'http://test.com/file.mp4?i=0'), 'file.mp4?i=1')
	})

	it('produces a relative path when only hash params are different', () => {
		equal(urlToRelativePath('http://test.com/file.mp4#i=1', 'http://test.com/file.mp4#i=0'), 'file.mp4#i=1')
	})

	it('resolves a target in the same one-segment base directory', () => {
		const base = getBaseUrl('https://cdn.example.com/1080p/seg-1.m4s')
		equal(urlToRelativePath('https://cdn.example.com/1080p/seg-2.m4s', base), 'seg-2.m4s')
	})

	it('resolves a target in the same two-segment base directory', () => {
		const base = getBaseUrl('https://cdn.example.com/v/1080p/seg-1.m4s')
		equal(urlToRelativePath('https://cdn.example.com/v/1080p/seg-2.m4s', base), 'seg-2.m4s')
	})

	it('resolves a target in the same three-segment base directory', () => {
		const base = getBaseUrl('https://cdn.example.com/a/b/c/seg-1.m4s')
		equal(urlToRelativePath('https://cdn.example.com/a/b/c/seg-2.m4s', base), 'seg-2.m4s')
	})

	it('resolves a sibling directory under a two-segment base', () => {
		const base = getBaseUrl('https://cdn.example.com/v/1080p/seg-1.m4s')
		equal(urlToRelativePath('https://cdn.example.com/v/720p/seg-2.m4s', base), '../720p/seg-2.m4s')
	})

	it('resolves a subdirectory of a two-segment base', () => {
		const base = getBaseUrl('https://cdn.example.com/v/1080p/seg-1.m4s')
		equal(urlToRelativePath('https://cdn.example.com/v/1080p/hi/seg-2.m4s', base), 'hi/seg-2.m4s')
	})

	it('returns url unchanged when a same-shaped path is cross-origin', () => {
		const base = getBaseUrl('https://cdn.example.com/v/1080p/seg-1.m4s')
		equal(urlToRelativePath('https://other.example.com/v/1080p/seg-2.m4s', base), 'https://other.example.com/v/1080p/seg-2.m4s')
	})

	it('preserves query and hash for a target in a two-segment base directory', () => {
		const base = getBaseUrl('https://cdn.example.com/v/1080p/seg-1.m4s')
		equal(urlToRelativePath('https://cdn.example.com/v/1080p/seg-2.m4s?a=1&b=2#frag', base), 'seg-2.m4s?a=1&b=2#frag')
	})

	it('resolves a target that diverges and matches again at a deeper segment', () => {
		const base = getBaseUrl('https://cdn.example.com/v/1080p/init/seg-1.m4s')
		equal(urlToRelativePath('https://cdn.example.com/v/720p/init/seg-2.m4s', base), '../../720p/init/seg-2.m4s')
	})

	it('prefixes ./ when the first segment contains a colon', () => {
		const request = 'https://cdn.example.com/v/1080p/seg-1.m4s'
		const target = 'https://cdn.example.com/v/1080p/seg:2.m4s'
		const result = urlToRelativePath(target, getBaseUrl(request))
		equal(result, './seg:2.m4s')
		equal(new URL(result, request).href, target)
	})

	it('prefixes ./ when the target has an empty segment after the base directory', () => {
		const request = 'https://cdn.example.com/v/1080p/seg-1.m4s'
		const target = 'https://cdn.example.com/v/1080p//seg-2.m4s'
		const result = urlToRelativePath(target, getBaseUrl(request))
		equal(result, './/seg-2.m4s')
		equal(new URL(result, request).href, target)
	})

	it('returns ./ when the target is the base directory', () => {
		const request = 'https://cdn.example.com/v/1080p/seg-1.m4s'
		const target = 'https://cdn.example.com/v/1080p/'
		const result = urlToRelativePath(target, getBaseUrl(request))
		equal(result, './')
		equal(new URL(result, request).href, target)
	})

	it('returns ./ with the query when the target is the root directory with a query', () => {
		const request = 'http://test.com/manifest.mpd'
		const target = 'http://test.com/?x=1'
		const result = urlToRelativePath(target, getBaseUrl(request))
		equal(result, './?x=1')
		equal(new URL(result, request).href, target)
	})

	it('does not prefix ./ when the colon is not in the first segment', () => {
		const base = getBaseUrl('https://cdn.example.com/v/1080p/seg-1.m4s')
		equal(urlToRelativePath('https://cdn.example.com/v/1080p/hi/seg:2.m4s', base), 'hi/seg:2.m4s')
		equal(urlToRelativePath('https://cdn.example.com/v/seg:2.m4s', base), '../seg:2.m4s')
	})
})
