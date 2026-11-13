import fs from 'node:fs'

export function fixtureFiles(): string[] {
	return fs.readdirSync(new URL('../fixtures/', import.meta.url))
}
