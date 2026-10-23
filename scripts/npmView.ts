import { exec } from './exec.ts'

// npm view exits with E404 for a package that has never been published
export async function viewPublished(name: string, prop: string): Promise<string | undefined> {
	try {
		return (await exec(`npm view ${name} ${prop}`)).trim()
	} catch (error) {
		if (error instanceof Error && error.message.includes('E404')) {
			return undefined
		}

		throw error
	}
}

export async function viewPublishedPeers(name: string): Promise<Record<string, string>> {
	const json = await viewPublished(name, 'peerDependencies --json')

	if (!json) {
		return {}
	}

	const parsed = JSON.parse(json)
	// npm 12 wraps the `--json` output of a single field in an array. npm 11 prints the object.
	return (Array.isArray(parsed) ? parsed[0] : parsed) ?? {}
}
