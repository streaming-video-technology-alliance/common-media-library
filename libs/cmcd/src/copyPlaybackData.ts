import { SfItem, SfToken } from '@svta/cml-structured-field-values'
import type { CmcdPlaybackData } from './CmcdPlaybackData.ts'

/** A copy of per-call data, with nested records and arrays copied, so a later mutation by the player does not change a late report. */
export function copyPlaybackData<D extends CmcdPlaybackData>(data: D | undefined): D | undefined {
	if (!data) {
		return undefined
	}
	const copy: Record<string, unknown> = {}
	for (const [key, value] of Object.entries(data)) {
		if (Array.isArray(value)) {
			copy[key] = [...value]
		}
		else if (value && typeof value === 'object' && !(value instanceof SfItem) && !(value instanceof SfToken)) {
			copy[key] = { ...value }
		}
		else {
			copy[key] = value
		}
	}
	return copy as D
}
