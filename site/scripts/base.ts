// Both the VitePress config and the redirect runner read the base path. The favicon
// link and every redirect stub join it to a path, so it must start and end with `/`.
export function siteBase(env: Record<string, string | undefined> = process.env): string {
	const base = env['SITE_BASE'] ?? '/'

	if (!base.startsWith('/') || !base.endsWith('/')) {
		throw new Error(
			`SITE_BASE must start and end with "/". Received "${base}". Example: /common-media-library/`,
		)
	}

	return base
}
