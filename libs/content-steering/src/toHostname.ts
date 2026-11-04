const HOSTNAME = /^(?:\[[\d.:A-Fa-f]+\]|[^\s#%/:?@[\\\]]+)$/

/**
 * Converts the `HOST` value of a pathway clone to a hostname.
 *
 * @param host - The `HOST` value.
 * @returns The hostname, or `undefined` when `host` is not a hostname without a port.
 *
 * @internal
 */
export function toHostname(host: string): string | undefined {
	if (!HOSTNAME.test(host)) {
		return undefined
	}

	try {
		return new URL(`http://${host}`).hostname
	} catch {
		return undefined
	}
}
