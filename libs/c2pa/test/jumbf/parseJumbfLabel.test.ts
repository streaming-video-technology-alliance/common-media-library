import { parseJumbfLabel } from '../../src/jumbf/parseJumbfLabel.ts'
import { strictEqual } from 'node:assert'
import { describe, it } from 'node:test'

function buildJumdData(label: string, toggles: number = 0x03): Uint8Array {
	const labelBytes = new TextEncoder().encode(label)
	// 16-byte UUID + 1-byte toggles + label bytes + null terminator
	const data = new Uint8Array(16 + 1 + labelBytes.length + 1)
	data[16] = toggles
	data.set(labelBytes, 17)
	data[17 + labelBytes.length] = 0x00
	return data
}

describe('parseJumbfLabel', () => {
	// #region example
	it('extracts label from a valid jumd box', () => {
		const jumdData = buildJumdData('c2pa.claim')
		strictEqual(parseJumbfLabel(jumdData), 'c2pa.claim')
	})
	// #endregion example

	it('returns null when label flags are not set', () => {
		const jumdData = buildJumdData('c2pa.claim', 0x00)
		strictEqual(parseJumbfLabel(jumdData), null)
	})

	it('returns null for data shorter than 17 bytes', () => {
		strictEqual(parseJumbfLabel(new Uint8Array(16)), null)
	})

	it('returns null when label is not null-terminated', () => {
		const data = new Uint8Array(17 + 5)
		data[16] = 0x03
		data.fill(0x61, 17) // 'aaaaa' with no null terminator
		strictEqual(parseJumbfLabel(data), null)
	})

	it('extracts label with only bits 0 and 1 set', () => {
		const jumdData = buildJumdData('c2pa.assertions', 0x03)
		strictEqual(parseJumbfLabel(jumdData), 'c2pa.assertions')
	})
})
