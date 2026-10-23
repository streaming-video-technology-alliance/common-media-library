export type Release = {
	package: string
	folder: string
	version: string
	date: string
}

const releaseHeading = /^## \[([0-9][^\]]*)\] - (\d{4}-\d{2}-\d{2})/gm

// One release per `## [x.y.z] - YYYY-MM-DD` heading. The Unreleased section has no date and is skipped.
export function parseReleases(changelog: string, pkg: { name: string; folder: string }): Release[] {
	return [...changelog.matchAll(releaseHeading)].map(match => ({
		package: pkg.name,
		folder: pkg.folder,
		version: match[1],
		date: match[2],
	}))
}

// Newest first. Releases on the same day sort by package name.
export function sortReleases(releases: Release[]): Release[] {
	return [...releases].sort(
		(a, b) => b.date.localeCompare(a.date) || a.package.localeCompare(b.package),
	)
}

export function renderReleases(releases: Release[]): string {
	const rows = sortReleases(releases).map(
		release =>
			`| ${release.date} | [${release.package}](/packages/${release.folder}/changelog) | ${release.version} |`,
	)

	return `# Releases

Every release of every package, newest first. Each link opens the changelog of the package.

| Date | Package | Version |
| --- | --- | --- |
${rows.join('\n')}
`
}

const defaultHeading = /^# Changelog\r?\n/

// Every package changelog starts with `# Changelog`. The site names the package, so search hits do too.
export function retitleChangelog(changelog: string, packageName: string): string {
	return changelog.replace(defaultHeading, `# ${packageName} changelog\n`)
}
