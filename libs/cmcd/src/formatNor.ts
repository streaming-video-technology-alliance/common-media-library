import { SfItem } from '@svta/cml-structured-field-values'
import { getBaseUrl, urlToRelativePath } from '@svta/cml-utils'
import type { CmcdNextObject } from './CmcdNextObject.ts'
import type { PrepareContext } from './PrepareContext.ts'

type Entry = { readonly path: string; readonly range: string | undefined }

const ESCAPE_OR_UNSAFE = /%[0-9A-Fa-f]{2}|[^A-Za-z0-9\-_.!~*'()]/gu

/** Percent-encodes a path and keeps the escapes it already has, so a relativized path is not encoded twice. */
function encodePath(path: string): string {
	return path.replace(ESCAPE_OR_UNSAFE, part => part.length === 3 ? part : encodeURIComponent(part))
}

function safeBase(baseUrl: string | undefined): string | undefined {
	if (baseUrl === undefined) {
		return undefined
	}
	try {
		return getBaseUrl(baseUrl)
	}
	catch {
		return undefined
	}
}

function toEntries(value: unknown, baseUrl: string | undefined): Entry[] {
	const items = Array.isArray(value) ? value : [value]
	const base = safeBase(baseUrl)
	const entries: Entry[] = []
	for (const item of items as CmcdNextObject[]) {
		const url = typeof item === 'string' ? item : item?.url
		if (typeof url !== 'string' || url === '') {
			continue
		}
		const range = typeof item === 'string' ? undefined : item.range
		entries.push({ path: base === undefined ? url : urlToRelativePath(url, base), range: range === '' ? undefined : range })
	}
	return entries
}

/** The wire form of `nor`. Version 2 is a list, version 1 is one percent-encoded path plus `nrr`. */
export function formatNor(value: unknown, context: PrepareContext): { nor?: unknown; nrr?: string } {
	const entries = toEntries(value, context.baseUrl)
	if (entries.length === 0) {
		return {}
	}
	if (context.version === 1) {
		const [first] = entries
		return first.range === undefined ? { nor: encodePath(first.path) } : { nor: encodePath(first.path), nrr: first.range }
	}
	return { nor: entries.map(entry => entry.range === undefined ? entry.path : new SfItem(entry.path, { r: entry.range })) }
}
