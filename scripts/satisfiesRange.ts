// Range syntax: https://github.com/npm/node-semver#ranges
// Prerelease rule: https://github.com/npm/node-semver#prerelease-tags
import { compareVersions, isVersion, parseVersion } from './compareVersions.ts'

const rangePattern = /^(\^|>=)(.+)$/

function sameRelease(a: string, b: string): boolean {
	const releaseA = parseVersion(a).release
	const releaseB = parseVersion(b).release
	return releaseA.every((segment, i) => segment === releaseB[i])
}

function hasPrerelease(version: string): boolean {
	return parseVersion(version).prerelease.length > 0
}

// The first version that a caret range on `floor` excludes.
function caretCeiling(floor: string): string {
	const [major, minor, patch] = parseVersion(floor).release

	if (major > 0) {
		return `${major + 1}.0.0-0`
	}

	if (minor > 0) {
		return `0.${minor + 1}.0-0`
	}

	return `0.0.${patch + 1}-0`
}

/**
 * Returns `true` when `version` satisfies `range`.
 * Supported ranges: `*`, one version, `^<version>`, and `>=<version>`.
 * Throws for any other range.
 */
export function satisfiesRange(version: string, range: string): boolean {
	const trimmed = range.trim()

	if (trimmed === '*') {
		return !hasPrerelease(version)
	}

	if (isVersion(trimmed)) {
		return compareVersions(version, trimmed) === 0
	}

	const match = rangePattern.exec(trimmed)

	if (!match || !isVersion(match[2])) {
		throw new Error(
			`Unsupported range "${range}". Expected "*", a version, "^<version>", or ">=<version>".`,
		)
	}

	const [, operator, floor] = match

	if (hasPrerelease(version) && !(hasPrerelease(floor) && sameRelease(version, floor))) {
		return false
	}

	if (compareVersions(version, floor) < 0) {
		return false
	}

	return operator === '>=' || compareVersions(version, caretCeiling(floor)) < 0
}
