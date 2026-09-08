import * as errorCodes from '@svta/cml-error-codes'
import { ok, strictEqual } from 'node:assert'

const exported: Record<string, unknown> = errorCodes

export function assertCatalogInvariants(catalog: Record<string, number>, category: number, size: number, constPrefix: string): void {
	const values = Object.values(catalog)
	strictEqual(values.length, size)
	strictEqual(new Set(values).size, values.length)
	for (const [name, value] of Object.entries(catalog)) {
		ok(Number.isInteger(value))
		strictEqual(Math.floor(value / 1000), category)
		const constName = name === 'UNKNOWN'
			? (category === 0 ? 'SVTA_UNKNOWN' : `${constPrefix}_UNKNOWN`)
			: `SVTA_${name}`
		strictEqual(exported[constName], value, `individual const ${constName} missing or mismatched`)
	}
	strictEqual(catalog['UNKNOWN'], category === 0 ? 999 : category * 1000)
}
