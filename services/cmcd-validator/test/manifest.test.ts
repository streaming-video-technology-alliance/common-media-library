import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { detectManifestType, rewriteHlsUrls, rewriteDashUrls, rewriteManifestUrls } from '../src/manifest.ts'

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

describe('rewriteHlsUrls', () => {
	const manifestUrl = 'https://cdn.example.com/stream/master.m3u8'

	// #region example
	it('should rewrite relative URI lines', () => {
		const manifest = [
			'#EXTM3U',
			'#EXT-X-STREAM-INF:BANDWIDTH=1280000',
			'720p/playlist.m3u8',
			'#EXT-X-STREAM-INF:BANDWIDTH=2560000',
			'1080p/playlist.m3u8',
		].join('\n')

		const result = rewriteHlsUrls(manifest, manifestUrl)

		assert.ok(result.includes('/proxy?url=https%3A%2F%2Fcdn.example.com%2Fstream%2F720p%2Fplaylist.m3u8'))
		assert.ok(result.includes('/proxy?url=https%3A%2F%2Fcdn.example.com%2Fstream%2F1080p%2Fplaylist.m3u8'))
	})
	// #endregion example

	it('should rewrite absolute URI lines', () => {
		const manifest = [
			'#EXTM3U',
			'#EXT-X-STREAM-INF:BANDWIDTH=1280000',
			'https://cdn.example.com/video/720p.m3u8',
			'#EXT-X-STREAM-INF:BANDWIDTH=2560000',
			'https://other-cdn.example.com/video/1080p.m3u8',
		].join('\n')

		const result = rewriteHlsUrls(manifest, manifestUrl)

		assert.ok(result.includes('/proxy?url=https%3A%2F%2Fcdn.example.com%2Fvideo%2F720p.m3u8'))
		assert.ok(result.includes('/proxy?url=https%3A%2F%2Fother-cdn.example.com%2Fvideo%2F1080p.m3u8'))
	})

	it('should rewrite URI attributes in tags', () => {
		const manifest = [
			'#EXTM3U',
			'#EXT-X-MAP:URI="init.mp4"',
			'#EXTINF:10,',
			'segment1.ts',
		].join('\n')

		const result = rewriteHlsUrls(manifest, manifestUrl)

		assert.ok(result.includes('URI="/proxy?url=https%3A%2F%2Fcdn.example.com%2Fstream%2Finit.mp4"'))
		assert.ok(result.includes('/proxy?url=https%3A%2F%2Fcdn.example.com%2Fstream%2Fsegment1.ts'))
	})

	it('should rewrite absolute URI attributes', () => {
		const manifest = '#EXT-X-MAP:URI="https://cdn.example.com/init.mp4"'

		const result = rewriteHlsUrls(manifest, manifestUrl)

		assert.ok(result.includes('URI="/proxy?url=https%3A%2F%2Fcdn.example.com%2Finit.mp4"'))
	})

	it('should preserve blank lines and comments', () => {
		const manifest = [
			'#EXTM3U',
			'',
			'# This is a comment',
			'#EXT-X-VERSION:3',
		].join('\n')

		const result = rewriteHlsUrls(manifest, manifestUrl)

		assert.equal(result, manifest)
	})

	it('should handle media playlists with segment URLs', () => {
		const mediaManifestUrl = 'https://cdn.example.com/stream/720p/playlist.m3u8'
		const manifest = [
			'#EXTM3U',
			'#EXT-X-TARGETDURATION:10',
			'#EXTINF:10,',
			'segment001.ts',
			'#EXTINF:10,',
			'segment002.ts',
		].join('\n')

		const result = rewriteHlsUrls(manifest, mediaManifestUrl)

		assert.ok(result.includes('/proxy?url=https%3A%2F%2Fcdn.example.com%2Fstream%2F720p%2Fsegment001.ts'))
		assert.ok(result.includes('/proxy?url=https%3A%2F%2Fcdn.example.com%2Fstream%2F720p%2Fsegment002.ts'))
	})

	it('should handle EXT-X-KEY with URI attribute', () => {
		const manifest = '#EXT-X-KEY:METHOD=AES-128,URI="keys/key.bin",IV=0x00000001'

		const result = rewriteHlsUrls(manifest, manifestUrl)

		assert.ok(result.includes('URI="/proxy?url=https%3A%2F%2Fcdn.example.com%2Fstream%2Fkeys%2Fkey.bin"'))
		assert.ok(result.includes('METHOD=AES-128'))
		assert.ok(result.includes('IV=0x00000001'))
	})

	it('should handle cross-origin URLs', () => {
		const manifest = [
			'#EXTM3U',
			'#EXT-X-STREAM-INF:BANDWIDTH=1280000',
			'https://other-cdn.example.com/stream/720p.m3u8',
		].join('\n')

		const result = rewriteHlsUrls(manifest, manifestUrl)

		assert.ok(result.includes('/proxy?url=https%3A%2F%2Fother-cdn.example.com%2Fstream%2F720p.m3u8'))
	})
})

describe('rewriteDashUrls', () => {
	const manifestUrl = 'https://cdn.example.com/stream/manifest.mpd'

	it('should rewrite BaseURL elements using path-based proxy', () => {
		const manifest = [
			'<?xml version="1.0"?>',
			'<MPD>',
			'  <BaseURL>https://cdn.example.com/video/</BaseURL>',
			'</MPD>',
		].join('\n')

		const result = rewriteDashUrls(manifest, manifestUrl)

		assert.ok(result.includes('<BaseURL>/proxy/https://cdn.example.com/video/</BaseURL>'))
	})

	it('should resolve relative BaseURL against manifest URL', () => {
		const manifest = [
			'<?xml version="1.0"?>',
			'<MPD>',
			'  <BaseURL>video/</BaseURL>',
			'</MPD>',
		].join('\n')

		const result = rewriteDashUrls(manifest, manifestUrl)

		assert.ok(result.includes('<BaseURL>/proxy/https://cdn.example.com/stream/video/</BaseURL>'))
	})

	it('should rewrite absolute URLs in attributes', () => {
		const manifest = '<SegmentTemplate initialization="https://cdn.example.com/init.mp4" media="https://cdn.example.com/seg_$Number$.m4s"/>'

		const result = rewriteDashUrls(manifest, manifestUrl)

		assert.ok(result.includes('initialization="/proxy?url=https%3A%2F%2Fcdn.example.com%2Finit.mp4"'))
		assert.ok(result.includes('media="/proxy?url=https%3A%2F%2Fcdn.example.com%2Fseg_%24Number%24.m4s"'))
	})

	it('should not touch relative template attributes', () => {
		const manifest = '<SegmentTemplate media="seg_$Number$.m4s" initialization="init.mp4"/>'

		const result = rewriteDashUrls(manifest, manifestUrl)

		// Relative non-http URLs in attributes should remain untouched
		assert.ok(result.includes('media="seg_$Number$.m4s"'))
		assert.ok(result.includes('initialization="init.mp4"'))
	})

	it('should leave empty BaseURL unchanged', () => {
		const manifest = '<BaseURL></BaseURL>'

		const result = rewriteDashUrls(manifest, manifestUrl)

		assert.equal(result, '<BaseURL></BaseURL>')
	})
})

describe('rewriteManifestUrls', () => {
	it('should dispatch to HLS rewriter for hls type', () => {
		const manifest = [
			'#EXTM3U',
			'#EXTINF:10,',
			'segment.ts',
		].join('\n')

		const result = rewriteManifestUrls(manifest, 'https://cdn.example.com/stream/playlist.m3u8', 'hls')

		assert.ok(result.includes('/proxy?url='))
	})

	it('should dispatch to DASH rewriter for dash type', () => {
		const manifest = '<BaseURL>https://cdn.example.com/video/</BaseURL>'

		const result = rewriteManifestUrls(manifest, 'https://cdn.example.com/stream/manifest.mpd', 'dash')

		assert.ok(result.includes('/proxy/'))
	})
})
