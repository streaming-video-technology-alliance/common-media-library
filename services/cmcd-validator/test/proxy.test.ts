import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import type { IncomingMessage, Server, ServerResponse } from 'node:http'
import { existsSync, unlinkSync } from 'node:fs'
import { Store } from '../src/store.ts'
import { handleProxy, extractTargetUrl } from '../src/proxy.ts'

const TEST_DB = './test-proxy.db'

function cleanupDb(path: string): void {
	for (const suffix of ['', '-wal', '-shm']) {
		if (existsSync(path + suffix)) {
			unlinkSync(path + suffix)
		}
	}
}

describe('extractTargetUrl', () => {
	it('should extract URL from query parameter', () => {
		const result = extractTargetUrl('/proxy?url=https%3A%2F%2Fcdn.example.com%2Fvideo.m3u8', 'localhost')
		assert.equal(result, 'https://cdn.example.com/video.m3u8')
	})

	it('should extract URL from path-based format', () => {
		const result = extractTargetUrl('/proxy/https://cdn.example.com/video/seg_1.m4s', 'localhost')
		assert.equal(result, 'https://cdn.example.com/video/seg_1.m4s')
	})

	it('should return null when no URL is provided', () => {
		const result = extractTargetUrl('/proxy', 'localhost')
		assert.equal(result, null)
	})

	it('should return null for path-based format without http', () => {
		const result = extractTargetUrl('/proxy/some-relative-path', 'localhost')
		assert.equal(result, null)
	})

	it('should prefer query parameter over path-based', () => {
		const result = extractTargetUrl('/proxy?url=https%3A%2F%2Fquery.example.com%2Fvideo.m3u8', 'localhost')
		assert.equal(result, 'https://query.example.com/video.m3u8')
	})
})

describe('handleProxy', () => {
	let store: Store
	let upstreamServer: Server
	let upstreamPort: number
	let proxyServer: Server
	let proxyPort: number

	beforeEach(async () => {
		cleanupDb(TEST_DB)
		store = new Store(TEST_DB)

		// Create a mock upstream server
		upstreamServer = await new Promise<Server>((resolve) => {
			const server = createServer((req: IncomingMessage, res: ServerResponse) => {
				const url = new URL(req.url || '/', `http://localhost`)

				if (url.pathname === '/stream/master.m3u8') {
					res.writeHead(200, { 'Content-Type': 'application/vnd.apple.mpegurl' })
					res.end([
						'#EXTM3U',
						'#EXT-X-STREAM-INF:BANDWIDTH=1280000',
						'720p/playlist.m3u8',
						'#EXT-X-STREAM-INF:BANDWIDTH=2560000',
						'1080p/playlist.m3u8',
					].join('\n'))
					return
				}

				if (url.pathname === '/stream/720p/playlist.m3u8') {
					res.writeHead(200, { 'Content-Type': 'application/vnd.apple.mpegurl' })
					res.end([
						'#EXTM3U',
						'#EXT-X-TARGETDURATION:10',
						'#EXTINF:10,',
						'segment001.ts',
						'#EXTINF:10,',
						'segment002.ts',
					].join('\n'))
					return
				}

				if (url.pathname === '/stream/720p/segment001.ts') {
					res.writeHead(200, { 'Content-Type': 'video/mp2t' })
					res.end('fake-segment-data')
					return
				}

				if (url.pathname === '/dash/manifest.mpd') {
					res.writeHead(200, { 'Content-Type': 'application/dash+xml' })
					res.end([
						'<?xml version="1.0"?>',
						'<MPD>',
						`  <BaseURL>http://localhost:${upstreamPort}/dash/</BaseURL>`,
						'  <Period>',
						'    <AdaptationSet>',
						'      <SegmentTemplate media="seg_$Number$.m4s" initialization="init.mp4"/>',
						'    </AdaptationSet>',
						'  </Period>',
						'</MPD>',
					].join('\n'))
					return
				}

				res.writeHead(404)
				res.end('Not Found')
			})
			server.listen(0, () => {
				const addr = server.address()
				upstreamPort = typeof addr === 'object' && addr ? addr.port : 0
				resolve(server)
			})
		})

		// Create a proxy server
		proxyServer = await new Promise<Server>((resolve) => {
			const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
				if (req.url?.startsWith('/proxy')) {
					await handleProxy(req, res, store)
					return
				}
				res.writeHead(404)
				res.end()
			})
			server.listen(0, () => {
				const addr = server.address()
				proxyPort = typeof addr === 'object' && addr ? addr.port : 0
				resolve(server)
			})
		})
	})

	afterEach(() => {
		proxyServer.close()
		upstreamServer.close()
		store.close()
		cleanupDb(TEST_DB)
	})

	it('should return 400 when no url parameter is provided', async () => {
		const res = await fetch(`http://localhost:${proxyPort}/proxy`)
		assert.equal(res.status, 400)
		const body = await res.json() as { error: string }
		assert.ok(body.error.includes('Missing url parameter'))
	})

	it('should proxy an HLS master manifest and rewrite URLs', async () => {
		const targetUrl = `http://localhost:${upstreamPort}/stream/master.m3u8`
		const res = await fetch(`http://localhost:${proxyPort}/proxy?url=${encodeURIComponent(targetUrl)}`)

		assert.equal(res.status, 200)
		const body = await res.text()

		// Should contain rewritten proxy URLs
		assert.ok(body.includes('/proxy?url='))
		// The rewritten URLs should resolve back to the upstream
		assert.ok(body.includes(encodeURIComponent(`http://localhost:${upstreamPort}/stream/720p/playlist.m3u8`)))
		assert.ok(body.includes(encodeURIComponent(`http://localhost:${upstreamPort}/stream/1080p/playlist.m3u8`)))
	})

	it('should proxy a media playlist and rewrite segment URLs', async () => {
		const targetUrl = `http://localhost:${upstreamPort}/stream/720p/playlist.m3u8`
		const res = await fetch(`http://localhost:${proxyPort}/proxy?url=${encodeURIComponent(targetUrl)}`)

		assert.equal(res.status, 200)
		const body = await res.text()

		assert.ok(body.includes(encodeURIComponent(`http://localhost:${upstreamPort}/stream/720p/segment001.ts`)))
		assert.ok(body.includes(encodeURIComponent(`http://localhost:${upstreamPort}/stream/720p/segment002.ts`)))
	})

	it('should proxy a non-manifest response and stream it through', async () => {
		const targetUrl = `http://localhost:${upstreamPort}/stream/720p/segment001.ts`
		const res = await fetch(`http://localhost:${proxyPort}/proxy?url=${encodeURIComponent(targetUrl)}`)

		assert.equal(res.status, 200)
		const body = await res.text()
		assert.equal(body, 'fake-segment-data')
	})

	it('should capture CMCD data from query parameters', async () => {
		const targetUrl = `http://localhost:${upstreamPort}/stream/720p/segment001.ts`
		const proxyUrl = `http://localhost:${proxyPort}/proxy?url=${encodeURIComponent(targetUrl)}&CMCD=br%3D3000%2Csid%3D%22test-session%22`

		const res = await fetch(proxyUrl)
		assert.equal(res.status, 200)

		const reports = store.getBySessionId('test-session')
		assert.equal(reports.length, 1)
		assert.equal(reports[0].type, 'request')
		assert.equal(reports[0].sessionId, 'test-session')
	})

	it('should proxy DASH manifests and rewrite BaseURL using path-based proxy', async () => {
		const targetUrl = `http://localhost:${upstreamPort}/dash/manifest.mpd`
		const res = await fetch(`http://localhost:${proxyPort}/proxy?url=${encodeURIComponent(targetUrl)}`)

		assert.equal(res.status, 200)
		const body = await res.text()

		// BaseURL should be rewritten with path-based proxy
		assert.ok(body.includes(`<BaseURL>/proxy/http://localhost:${upstreamPort}/dash/</BaseURL>`))
		// Relative template attributes should be preserved
		assert.ok(body.includes('media="seg_$Number$.m4s"'))
		assert.ok(body.includes('initialization="init.mp4"'))
	})

	it('should support path-based proxy for DASH template resolution', async () => {
		const targetUrl = `http://localhost:${upstreamPort}/stream/720p/segment001.ts`
		const res = await fetch(`http://localhost:${proxyPort}/proxy/${targetUrl}`)

		assert.equal(res.status, 200)
		const body = await res.text()
		assert.equal(body, 'fake-segment-data')
	})

	it('should set CORS headers on proxy responses', async () => {
		const targetUrl = `http://localhost:${upstreamPort}/stream/720p/segment001.ts`
		const res = await fetch(`http://localhost:${proxyPort}/proxy?url=${encodeURIComponent(targetUrl)}`)

		assert.equal(res.headers.get('access-control-allow-origin'), '*')
	})
})
