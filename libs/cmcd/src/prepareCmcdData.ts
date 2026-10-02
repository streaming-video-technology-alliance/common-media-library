import { SfItem, SfToken } from '@svta/cml-structured-field-values'
import { CMCD_INNER_LIST_KEYS } from './CMCD_INNER_LIST_KEYS.ts'
import { CMCD_KEY_SPECS } from './CMCD_KEY_SPECS.ts'
import { CMCD_V2 } from './CMCD_V2.ts'
import type { Cmcd } from './Cmcd.ts'
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.ts'
import type { CmcdFormatterOptions } from './CmcdFormatterOptions.ts'
import type { CmcdKey } from './CmcdKey.ts'
import type { CmcdKeySpec } from './CmcdKeySpec.ts'
import { CMCD_EVENT_MODE, CMCD_REQUEST_MODE, type CmcdReportingMode } from './CmcdReportingMode.ts'
import type { CmcdValue } from './CmcdValue.ts'
import type { CmcdVersion } from './CmcdVersion.ts'
import { downConvertToV1 } from './downConvertToV1.ts'
import { getKeySpec } from './getKeySpec.ts'
import { isValid } from './isValid.ts'
import { normalizeValue } from './normalizeValue.ts'
import { toBareValue } from './toBareValue.ts'
import { toTokenString } from './toTokenString.ts'

function hasKey(spec: CmcdKeySpec, reportingMode: CmcdReportingMode, isV1: boolean): boolean {
	return (spec.mode === undefined || spec.mode === reportingMode)
		&& (spec.version === undefined || (spec.version === 1) === isV1)
}

function isRequired(spec: CmcdKeySpec, event: string | undefined): boolean {
	return spec.requiredOn === 'always' || (event !== undefined && spec.requiredOn === event)
}

function hasObjectTypes(spec: CmcdKeySpec): boolean {
	return (spec.type === 'integer' || spec.type === 'ot-list') && spec.ot !== undefined
}

function needsV1ObjectType(obj: Record<string, any>, filter: CmcdEncodeOptions['filter']): boolean {
	if (typeof filter !== 'function' || filter('ot')) {
		return true
	}

	for (const key of CMCD_INNER_LIST_KEYS) {
		if (Array.isArray(toBareValue(obj[key])) && filter(key as CmcdKey)) {
			return true
		}
	}

	return false
}

function allowsObjectType(spec: CmcdKeySpec, objectType: string | undefined): boolean {
	if (objectType === undefined || (spec.type !== 'integer' && spec.type !== 'ot-list') || spec.ot === undefined) {
		return true
	}

	return spec.ot.includes(objectType)
}

function isDefaultValue(spec: CmcdKeySpec, value: unknown): boolean {
	return 'omitDefault' in spec && toBareValue(value) === spec.omitDefault
}

function insertKey(keys: string[], specs: CmcdKeySpec[], key: string): void {
	let index = 0

	while (index < keys.length && keys[index] < key) {
		index++
	}

	keys.splice(index, 0, key)
	specs.splice(index, 0, CMCD_KEY_SPECS[key])
}

function prepareValue(key: string, value: unknown, spec: CmcdKeySpec, options: CmcdEncodeOptions, formatterOptions: CmcdFormatterOptions): unknown {
	const formatter = options.formatters?.[key as CmcdKey]

	if (typeof formatter !== 'function') {
		return value == null ? undefined : normalizeValue(value, spec, formatterOptions)
	}

	const formatted: unknown = isValid(value) ? formatter(value as CmcdValue, formatterOptions) : value

	if (!isValid(formatted) && !(formatted === false && spec.type === 'boolean')) {
		return undefined
	}

	if (spec.type === 'token') {
		if (typeof formatted === 'string') {
			return new SfToken(formatted)
		}

		if (formatted instanceof SfItem && typeof formatted.value === 'string') {
			return new SfItem(new SfToken(formatted.value), formatted.params)
		}
	}

	return formatted
}

/**
 * Convert a generic object to CMCD data.
 *
 * @param obj - The CMCD object to process.
 * @param options - Options for encoding.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/prepareCmcdData.test.ts#example}
 */
export function prepareCmcdData(obj: Record<string, any>, options: CmcdEncodeOptions = {}): Cmcd {
	const results: Record<string, unknown> = {}

	if (obj == null || typeof obj !== 'object') {
		return results as Cmcd
	}

	const version = options.version || toBareValue(obj['v']) as CmcdVersion || CMCD_V2
	const reportingMode = options.reportingMode || CMCD_REQUEST_MODE
	const isV1 = version === 1
	const isEventReport = !isV1 && reportingMode === CMCD_EVENT_MODE
	const formatterOptions: CmcdFormatterOptions = { version, reportingMode, baseUrl: options.baseUrl }
	const filter = options.filter

	let objectTypeValue: unknown
	let objectType: string | undefined

	if (isV1 && needsV1ObjectType(obj, filter)) {
		objectTypeValue = prepareValue('ot', obj['ot'], CMCD_KEY_SPECS['ot'], options, formatterOptions)
		objectType = toTokenString(objectTypeValue)
	}

	const data = isV1 ? downConvertToV1(obj, objectType) : obj
	const eventValue = isEventReport ? prepareValue('e', data['e'], CMCD_KEY_SPECS['e'], options, formatterOptions) : undefined
	const event = toTokenString(eventValue)
	const keys: string[] = []
	const specs: CmcdKeySpec[] = []
	let passed = false
	let needsObjectType = false

	for (const key of Object.keys(data).sort()) {
		const spec = getKeySpec(key)

		if (spec === undefined || !hasKey(spec, reportingMode, isV1)) {
			continue
		}

		if (typeof filter !== 'function' || filter(key as CmcdKey)) {
			passed = true
		}
		else if (!isRequired(spec, event)) {
			continue
		}

		if (spec.onlyOn !== undefined && spec.onlyOn !== event) {
			continue
		}

		if (key === 'ot' || hasObjectTypes(spec)) {
			needsObjectType = true
		}

		keys.push(key)
		specs.push(spec)
	}

	if (!passed && !isEventReport) {
		return results as Cmcd
	}

	if (needsObjectType && !isV1) {
		objectTypeValue = prepareValue('ot', data['ot'], CMCD_KEY_SPECS['ot'], options, formatterOptions)
		objectType = toTokenString(objectTypeValue)
	}

	if (isEventReport && !keys.includes('ts')) {
		insertKey(keys, specs, 'ts')
	}

	if (!isV1 && !keys.includes('v')) {
		insertKey(keys, specs, 'v')
	}

	const values: unknown[] = new Array(keys.length)

	for (let i = keys.length - 1; i >= 0; i--) {
		const key = keys[i]
		const spec = specs[i]

		if (spec.type === 'ot-list' && spec.supersededBy !== undefined) {
			const exact = keys.indexOf(spec.supersededBy, i + 1)

			if (exact !== -1 && values[exact] !== undefined) {
				continue
			}
		}

		if (key === 'v') {
			values[i] = version
		}
		else if (key === 'ot') {
			values[i] = objectTypeValue
		}
		else if (key === 'e') {
			values[i] = eventValue
		}
		else if (isV1 || allowsObjectType(spec, objectType)) {
			values[i] = prepareValue(key, data[key], spec, options, formatterOptions)
		}

		if (key === 'ts') {
			const timestamp = toBareValue(values[i])

			if (typeof timestamp !== 'number' || !Number.isFinite(timestamp)) {
				values[i] = Date.now()
			}
		}
	}

	for (let i = 0; i < keys.length; i++) {
		const value = values[i]

		if (value !== undefined && (!isDefaultValue(specs[i], value) || isRequired(specs[i], event))) {
			results[keys[i]] = value
		}
	}

	return results as Cmcd
}
