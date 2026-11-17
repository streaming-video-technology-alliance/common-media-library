// The fields of a box without `view` and `size`.
export function values(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map(values)
	}

	if (value === null || typeof value !== 'object' || ArrayBuffer.isView(value)) {
		return value
	}

	return Object.fromEntries(
		Object.entries(value)
			.filter(([key]) => key !== 'view' && key !== 'size')
			.map(([key, field]): [string, unknown] => [key, values(field)]),
	)
}
