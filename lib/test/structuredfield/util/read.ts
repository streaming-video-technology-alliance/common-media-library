// read json test suite
export async function read(name: string) {
	const json = await import(`../../../../structured-field-tests/${name}.json`, { assert: { type: 'json' } });
	return json.default;
}
