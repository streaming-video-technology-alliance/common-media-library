import { SfItem } from '@svta/cml-structured-field-values/SfItem';
import base32 from 'hi-base32';

// convert "expected" in test.json into JS Primitive
export function format(e: any): any {
	if (Array.isArray(e)) {
		return e.map(format);
	}
	switch (e[`__type`]) {
		case `binary`:
			return Uint8Array.from(e.value === `` ? [] : base32.decode.asBytes(e.value));
		case `token`:
			return Symbol.for(e.value);
		case `date`:
			return new Date(e.value * 1000);
		default:
			return e;
	}
}

export function formatItem([value, params]: any[]): SfItem {
	value = format(value);
	params = formatParams(params);
	return new SfItem(value, params);
}

export function formatList(expected: any): SfItem[] {
	return expected.map(([value, params]: any[]) => {
		value = formatValue(value);
		params = formatParams(params);
		return new SfItem(value, params);
	});
}

export function formatDict(expected: any): Record<string, SfItem> {
	return Object.fromEntries(expected.map(([name, [value, params]]: any[]) => {
		value = formatValue(value);
		params = formatParams(params);
		return [name, new SfItem(value, params)];
	}));
}

function formatValue(value: any) {
	return Array.isArray(value) ? value.map(formatItem) : format(value);
}

function formatParams(params: any) {
	return params.length === 0 ? undefined : Object.fromEntries(params.map(format));
}
