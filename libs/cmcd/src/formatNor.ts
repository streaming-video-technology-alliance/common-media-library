import { SfItem } from '@svta/cml-structured-field-values'
import { getBaseUrl, urlToRelativePath, type ValueOrArray } from '@svta/cml-utils'
import type { CmcdFormatterOptions } from './CmcdFormatterOptions.ts'
import type { CmcdVersion } from './CmcdVersion.ts'

type CmcdNorEntry = string | SfItem<string>

function toBase(baseUrl: string | undefined): string | undefined {
	if (!baseUrl) {
		return undefined
	}

	try {
		return new URL(getBaseUrl(baseUrl)).href
	}
	catch {
		return undefined
	}
}

function formatPath(path: unknown, base: string | undefined, version: CmcdVersion): string | undefined {
	if (typeof path !== 'string' || path === '') {
		return undefined
	}

	const relative = base ? urlToRelativePath(path, base) : path

	return version === 1 ? encodeURIComponent(relative) : relative
}

function formatEntry(entry: unknown, base: string | undefined, version: CmcdVersion): CmcdNorEntry | undefined {
	if (entry instanceof SfItem) {
		const path = formatPath(entry.value, base, version)

		return path === undefined ? undefined : new SfItem(path, entry.params)
	}

	return formatPath(entry, base, version)
}

function formatEntries(entries: unknown[], base: string | undefined, version: CmcdVersion): CmcdNorEntry[] | undefined {
	const list: CmcdNorEntry[] = []

	for (const entry of entries) {
		const formatted = formatEntry(entry, base, version)

		if (formatted !== undefined) {
			list.push(formatted)
		}
	}

	return list.length > 0 ? list : undefined
}

/**
 * Formats a `nor` value. Each path becomes relative to `baseUrl` when `baseUrl` is a valid URL.
 * Version 1 encodes the path with `encodeURIComponent`. Version 2 wraps one path in a list.
 * The parameters of an entry and of an inner list stay on the value.
 *
 * @param value - A path, an `SfItem` of a path, or a list of them. An `SfItem` can also wrap the list.
 * @param options - The version and `baseUrl` of the report.
 *
 * @returns The formatted value, or `undefined` when no entry is a non-empty string.
 *
 * @internal
 */
export function formatNor(value: unknown, options: Pick<CmcdFormatterOptions, 'version' | 'baseUrl'>): ValueOrArray<CmcdNorEntry> | undefined {
	const base = toBase(options.baseUrl)
	const version = options.version

	if (Array.isArray(value)) {
		return formatEntries(value, base, version)
	}

	if (value instanceof SfItem && Array.isArray(value.value)) {
		const list = formatEntries(value.value, base, version)

		return list && new SfItem(list, value.params)
	}

	const entry = formatEntry(value, base, version)

	return version === 1 || entry === undefined ? entry : [entry]
}
