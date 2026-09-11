import { encodeBase64 } from '@svta/cml-utils'
import type { CmcdRequestLike } from './CmcdRequestLike.ts'
import type { CmcdResponseInfo } from './CmcdResponseInfo.ts'
import { removeCmcdQuery } from './placeRequestReport.ts'
import { readHeader } from './readHeader.ts'
import type { RequestOrigin } from './RequestOrigin.ts'

function toBase64(text: string): string {
	return encodeBase64(new TextEncoder().encode(text))
}

/**
 * The derived `rr` keys: `url` without the CMCD parameter, `rc`, and when known `ts`, `ttfb`, `ttlb`, `cmsds`, and `cmsdd`.
 * Resource Timing reports zero for `responseStart` of a cross-origin resource without `Timing-Allow-Origin`, so `ttfb` is
 * omitted when `responseStart` is absent, zero, or earlier than `startTime`. Without timing, `ttlb` measures the call.
 */
export function toResponseKeys(request: CmcdRequestLike, info: CmcdResponseInfo, origin: RequestOrigin | undefined): Record<string, unknown> {
	const keys: Record<string, unknown> = { url: removeCmcdQuery(request.url), rc: info.status ?? 0 }
	const timing = info.timing
	if (timing && typeof timing.startTime === 'number') {
		keys['ts'] = Math.round(performance.timeOrigin + timing.startTime)
		if (typeof timing.responseStart === 'number' && timing.responseStart > 0 && timing.responseStart >= timing.startTime) {
			keys['ttfb'] = Math.round(timing.responseStart - timing.startTime)
		}
		if (typeof timing.duration === 'number' && timing.duration > 0) {
			keys['ttlb'] = Math.round(timing.duration)
		}
		else if (typeof timing.responseEnd === 'number' && timing.responseEnd > timing.startTime) {
			keys['ttlb'] = Math.round(timing.responseEnd - timing.startTime)
		}
	}
	else if (origin?.startedAt !== undefined) {
		keys['ts'] = origin.startedAt
		keys['ttlb'] = Math.max(0, Date.now() - origin.startedAt)
	}
	const cmsds = readHeader(info.headers, 'CMSD-Static')
	if (cmsds) {
		keys['cmsds'] = toBase64(cmsds)
	}
	const cmsdd = readHeader(info.headers, 'CMSD-Dynamic')
	if (cmsdd) {
		keys['cmsdd'] = toBase64(cmsdd)
	}
	return keys
}
