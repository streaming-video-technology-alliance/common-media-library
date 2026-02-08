import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { detectManifestType, rewriteManifestUrls } from '../src/manifest.ts'

describe('detectManifestType', () => {
	it('should detect HLS by content type', () => {
		assert.equal(detectManifestType('application/vnd.apple.mpegurl', '/video.mp4'), 'hls')
		assert.equal(detectManifestType('application/x-mpegURL', '/video.mp4'), 'hls')
	})

	it('should detect HLS by file extension', () => {
		assert.equal(detectManifestType('text/plain', '/stream/playlist.m3u8'), 'hls')
		assert.equal(detectManifestType('', '/stream/playlist.m3u'), 'hls')
	})

	it('should detect DASH by content type', () => {
		assert.equal(detectManifestType('application/dash+xml', '/video.mp4'), 'dash')
	})

	it('should detect DASH by file extension', () => {
		assert.equal(detectManifestType('text/plain', '/stream/manifest.mpd'), 'dash')
	})

	it('should return null for non-manifest content', () => {
		assert.equal(detectManifestType('video/mp4', '/segment.mp4'), null)
		assert.equal(detectManifestType('application/json', '/api/data'), null)
	})
})

describe('rewriteManifestUrls', () => {
	const upstream = 'https://cdn.example.com'
	const proxyBase = '/proxy'

	it('should rewrite absolute URLs in HLS manifests', () => {
		const manifest = [
			'#EXTM3U',
			'#EXT-X-STREAM-INF:BANDWIDTH=1280000',
			'https://cdn.example.com/video/720p.m3u8',
			'#EXT-X-STREAM-INF:BANDWIDTH=2560000',
			'https://cdn.example.com/video/1080p.m3u8',
		].join('\n')

		const result = rewriteManifestUrls(manifest, upstream, proxyBase)

		assert.ok(result.includes('/proxy/video/720p.m3u8'))
		assert.ok(result.includes('/proxy/video/1080p.m3u8'))
		assert.ok(!result.includes('https://cdn.example.com'))
	})

	it('should rewrite absolute URLs in DASH manifests', () => {
		const manifest = [
			'<?xml version="1.0"?>',
			'<MPD>',
			'  <BaseURL>https://cdn.example.com/video/</BaseURL>',
			'</MPD>',
		].join('\n')

		const result = rewriteManifestUrls(manifest, upstream, proxyBase)

		assert.ok(result.includes('<BaseURL>/proxy/video/</BaseURL>'))
		assert.ok(!result.includes('https://cdn.example.com'))
	})

	it('should leave relative URLs unchanged', () => {
		const manifest = [
			'#EXTM3U',
			'#EXTINF:10,',
			'segment1.ts',
			'#EXTINF:10,',
			'segment2.ts',
		].join('\n')

		const result = rewriteManifestUrls(manifest, upstream, proxyBase)

		assert.ok(result.includes('segment1.ts'))
		assert.ok(result.includes('segment2.ts'))
	})

	it('should rewrite protocol-relative URLs', () => {
		const manifest = [
			'#EXTM3U',
			'#EXTINF:10,',
			'//cdn.example.com/video/segment.ts',
		].join('\n')

		const result = rewriteManifestUrls(manifest, upstream, proxyBase)

		assert.ok(result.includes('/proxy/video/segment.ts'))
	})

	it('should handle upstream with a base path', () => {
		const manifest = [
			'#EXTM3U',
			'#EXTINF:10,',
			'https://cdn.example.com/base/path/segment.ts',
		].join('\n')

		const result = rewriteManifestUrls(manifest, 'https://cdn.example.com/base/path', proxyBase)

		assert.ok(result.includes('/proxy/segment.ts'))
	})

	it('should rewrite URI attributes in HLS', () => {
		const manifest = [
			'#EXTM3U',
			'#EXT-X-MAP:URI="https://cdn.example.com/init.mp4"',
			'#EXTINF:10,',
			'https://cdn.example.com/segment1.ts',
		].join('\n')

		const result = rewriteManifestUrls(manifest, upstream, proxyBase)

		assert.ok(result.includes('URI="/proxy/init.mp4"'))
		assert.ok(result.includes('/proxy/segment1.ts'))
	})
})
