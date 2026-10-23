import { SfItem, type SfBareItem } from '@svta/cml-structured-field-values'
import base32 from 'hi-base32'

export type RawTyped =
	| { __type: 'binary' | 'token'; value: string }
	| { __type: 'date'; value: number }
export type RawBareItem = string | number | boolean | RawTyped
export type RawParams = [string, RawBareItem][]
export type RawItem = [RawBareItem | RawItem[], RawParams]
export type RawList = RawItem[]
export type RawDict = [string, RawItem][]

// convert "expected" in test.json into JS Primitive
export function format(e: RawBareItem): SfBareItem {
	if (typeof e !== 'object') {
		return e
	}

	switch (e.__type) {
		case 'binary':
			return Uint8Array.from(e.value === '' ? [] : base32.decode.asBytes(e.value))
		case 'token':
			return Symbol.for(e.value)
		case 'date':
			return new Date(e.value * 1000)
	}
}

export function formatItem([value, params]: RawItem): SfItem {
	return new SfItem(formatValue(value), formatParams(params))
}

export function formatList(expected: RawList): SfItem[] {
	return expected.map(formatItem)
}

export function formatDict(expected: RawDict): Record<string, SfItem> {
	return Object.fromEntries(expected.map(([name, item]) => [name, formatItem(item)]))
}

function formatValue(value: RawBareItem | RawItem[]): SfBareItem | SfItem[] {
	return Array.isArray(value) ? value.map(formatItem) : format(value)
}

function formatParams(params: RawParams): Record<string, SfBareItem> | undefined {
	return params.length === 0
		? undefined
		: Object.fromEntries(params.map(([key, value]) => [key, format(value)]))
}
