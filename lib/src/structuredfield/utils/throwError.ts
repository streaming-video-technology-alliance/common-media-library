function format(value: any) {
	if (Array.isArray(value)) {
		return JSON.stringify(value);
	}
	if (value instanceof Map) {
		return 'Map{}';
	}
	if (value instanceof Set) {
		return 'Set{}';
	}
	if (typeof value === 'object') {
		return JSON.stringify(value);
	}
	return String(value);
}

export function throwError(action: string, src: any, type: string, cause?: any): Error {
	return new Error(`failed to ${action} "${format(src)}" as ${type}`, { cause });
}
