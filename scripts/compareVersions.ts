// Precedence rules: https://semver.org/#spec-item-11
type ParsedVersion = {
	release: number[];
	prerelease: string[];
};

const versionPattern = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/

function parseVersion(version: string): ParsedVersion {
	const match = versionPattern.exec(version)

	if (!match) {
		throw new Error(`Invalid version "${version}". Expected <major>.<minor>.<patch>[-<prerelease>][+<build>].`)
	}

	return {
		release: [Number(match[1]), Number(match[2]), Number(match[3])],
		prerelease: match[4] ? match[4].split('.') : [],
	}
}

function compareIdentifiers(a: string, b: string): number {
	const numericA = /^\d+$/.test(a)
	const numericB = /^\d+$/.test(b)

	if (numericA && numericB) {
		return Math.sign(Number(a) - Number(b))
	}

	if (numericA) {
		return -1
	}

	if (numericB) {
		return 1
	}

	return a < b ? -1 : a > b ? 1 : 0
}

/**
 * Returns `true` when `value` is one exact semantic version and not a range.
 */
export function isVersion(value: string): boolean {
	return versionPattern.test(value)
}

/**
 * Compares two semantic versions.
 * Returns a negative number when `a` is lower than `b`, `0` when they are equal, and a positive number when `a` is higher.
 */
export function compareVersions(a: string, b: string): number {
	const versionA = parseVersion(a)
	const versionB = parseVersion(b)

	for (let i = 0; i < 3; i++) {
		if (versionA.release[i] !== versionB.release[i]) {
			return versionA.release[i] - versionB.release[i]
		}
	}

	if (versionA.prerelease.length === 0 || versionB.prerelease.length === 0) {
		return versionB.prerelease.length - versionA.prerelease.length
	}

	const length = Math.min(versionA.prerelease.length, versionB.prerelease.length)

	for (let i = 0; i < length; i++) {
		const result = compareIdentifiers(versionA.prerelease[i], versionB.prerelease[i])

		if (result !== 0) {
			return result
		}
	}

	return versionA.prerelease.length - versionB.prerelease.length
}
