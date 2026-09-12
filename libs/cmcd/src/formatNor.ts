import { SfItem } from '@svta/cml-structured-field-values'
import type { BaseParts } from './BaseParts.ts'
import type { CmcdNextObject } from './CmcdNextObject.ts'
import type { PrepareContext } from './PrepareContext.ts'

type Entry = { readonly path: string; readonly range: string | undefined }

const ESCAPE_OR_UNSAFE = /%[0-9A-Fa-f]{2}|[^A-Za-z0-9\-_.!~*'()]/gu

/** Percent-encodes a path and keeps the escapes it already has, so a relativized path is not encoded twice. */
function encodePath(path: string): string {
	return path.replace(ESCAPE_OR_UNSAFE, part => part.length === 3 ? part : encodeURIComponent(part))
}

/** Parses a base URL into its origin and directory segments, or `null` when it does not parse. Parses the URL once. */
export function parseBaseUrl(url: string): BaseParts | null {
	try {
		const parsed = new URL(url)
		return { origin: parsed.origin, dir: parsed.pathname.split('/').slice(1, -1) }
	}
	catch {
		return null
	}
}

/**
 * The path of `url` relative to `base`. `url` is returned unchanged when it does not parse or its origin differs.
 * Parses `url` once and reuses the already-parsed `base`, so a decoration parses one URL for the nor target and none
 * for the request. The result matches `urlToRelativePath(url, getBaseUrl(requestUrl))`, whose base parse this removes.
 */
function relativePath(url: string, base: BaseParts): string {
	let to: URL
	try {
		to = new URL(url)
	}
	catch {
		return url
	}
	if (to.origin !== base.origin) {
		return url
	}
	const toPath = to.pathname.split('/').slice(1)
	const fromPath = base.dir.slice()
	const length = Math.min(toPath.length, fromPath.length)
	for (let i = 0; i < length; i++) {
		if (toPath[i] !== fromPath[i]) {
			break
		}
		toPath.shift()
		fromPath.shift()
	}
	while (fromPath.length) {
		fromPath.shift()
		toPath.unshift('..')
	}
	return toPath.join('/') + to.search + to.hash
}

type NorItem = CmcdNextObject | SfItem<string, { r?: string }>

/** Reads the path and range from a raw entry or an already-normalized one. A second `prepareReport` pass is then a no-op. */
function toEntries(value: unknown, base: BaseParts | null): Entry[] {
	const items = Array.isArray(value) ? value : [value]
	const entries: Entry[] = []
	for (const item of items as NorItem[]) {
		const url = typeof item === 'string' ? item : item instanceof SfItem ? item.value : item?.url
		if (typeof url !== 'string' || url === '') {
			continue
		}
		const range = typeof item === 'string' ? undefined : item instanceof SfItem ? item.params?.r : item.range
		entries.push({ path: base === null ? url : relativePath(url, base), range: range === '' ? undefined : range })
	}
	return entries
}

/** The wire form of `nor`. Version 2 is a list, version 1 is one percent-encoded path plus `nrr`. */
export function formatNor(value: unknown, context: PrepareContext): { nor?: unknown; nrr?: string } {
	const base = context.base !== undefined ? context.base : context.baseUrl !== undefined ? parseBaseUrl(context.baseUrl) : null
	const entries = toEntries(value, base)
	if (entries.length === 0) {
		return {}
	}
	if (context.version === 1) {
		const [first] = entries
		return first.range === undefined ? { nor: encodePath(first.path) } : { nor: encodePath(first.path), nrr: first.range }
	}
	return { nor: entries.map(entry => entry.range === undefined ? entry.path : new SfItem(entry.path, { r: entry.range })) }
}
