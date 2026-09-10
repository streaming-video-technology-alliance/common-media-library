import { CMCD_PARAM } from './CMCD_PARAM.ts'
import type { Cmcd } from './Cmcd.ts'
import type { CmcdHeaderMap } from './CmcdHeaderMap.ts'
import type { CmcdRequestLike } from './CmcdRequestLike.ts'
import { CMCD_HEADERS, type CmcdTransmissionMode } from './CmcdTransmissionMode.ts'
import type { EmittedReport } from './emitReport.ts'
import { toPreparedCmcdHeaders } from './toPreparedCmcdHeaders.ts'

const CMCD_QUERY_PARAM = /([?&])CMCD=[^&#]*&?/

/** The URL without its `CMCD` parameter. */
export function removeCmcdQuery(url: string): string {
	return url.replace(CMCD_QUERY_PARAM, (match, separator: string) => match.endsWith('&') ? separator : '')
}

function removeCmcdHeaders(headers: Readonly<Record<string, string>>): Record<string, string> {
	const copy: Record<string, string> = {}
	for (const [name, value] of Object.entries(headers)) {
		if (!name.toLowerCase().startsWith('cmcd-')) {
			copy[name] = value
		}
	}
	return copy
}

function appendQuery(url: string, query: string): string {
	const hash = url.indexOf('#')
	const base = hash < 0 ? url : url.slice(0, hash)
	const fragment = hash < 0 ? '' : url.slice(hash)
	return `${base}${base.includes('?') ? '&' : '?'}${query}${fragment}`
}

/** Removes any earlier CMCD placement from the request, then adds the report in the configured mode. */
export function placeRequestReport(request: CmcdRequestLike, emitted: EmittedReport | undefined, mode: CmcdTransmissionMode, headerMap: Partial<CmcdHeaderMap> | undefined): { url: string; headers: Record<string, string> | undefined } {
	let url = removeCmcdQuery(request.url)
	let headers = request.headers ? removeCmcdHeaders(request.headers) : undefined
	if (!emitted) {
		return { url, headers }
	}
	if (mode === CMCD_HEADERS) {
		headers = { ...(headers ?? {}), ...toPreparedCmcdHeaders(emitted.prepared as Cmcd, headerMap) }
	}
	else if (emitted.line !== '') {
		url = appendQuery(url, `${CMCD_PARAM}=${encodeURIComponent(emitted.line)}`)
	}
	return { url, headers }
}
