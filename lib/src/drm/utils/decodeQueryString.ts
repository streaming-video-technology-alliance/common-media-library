export function decodeQueryString(uri: string): Record<string, string | undefined> {
	const results: Record<string, string | undefined> = {};

	if (!uri) {
		return results;
	}

	uri.replace(/^[^?]*\?/, '')
		.replace(/([^?=&]+)(=([^&]*))?/g, (_match, key, _equal, value) => {
			try {
				results[decodeURIComponent(key)] = value ? decodeURIComponent(value) : undefined;
			}
			catch {
				results[decodeURIComponent(key)] = undefined;
			}
			return _match;
		});

	return results;
}

