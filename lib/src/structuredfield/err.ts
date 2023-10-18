export function err(strings: TemplateStringsArray, ...keys: any[]) {
	keys = keys.map((key) => {
		if (Array.isArray(key)) {
			return JSON.stringify(key);
		}
		if (key instanceof Map) {
			return 'Map{}';
		}
		if (key instanceof Set) {
			return 'Set{}';
		}
		if (typeof key === 'object') {
			return JSON.stringify(key);
		}
		return String(key);
	});
	const result = strings.map((string, i) => {
		return [string, keys.at(i)];
	});
	return result.flat().join('');
}
