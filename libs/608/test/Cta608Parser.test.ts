import type { PACData } from '@svta/cml-608'
import { Cta608Parser } from '@svta/cml-608'
import { deepEqual, equal } from 'node:assert'
import { beforeEach, describe, it, vi } from 'vite-plus/test'

type ParserInternals = {
	parseCmd(a: number, b: number): boolean
	parseMidrow(a: number, b: number): boolean
	parsePAC(a: number, b: number): boolean
	interpretPAC(row: number, byte: number): PACData
	parseChars(a: number, b: number): number[]
	parseBackgroundAttributes(a: number, b: number): boolean
}

describe('Cea608Parser Tests', () => {
	let parser: Cta608Parser
	let internals: ParserInternals

	beforeEach(() => {
		parser = new Cta608Parser(1, null, null)
		internals = parser as unknown as ParserInternals
	})

	it('adds data correctly, parseCmd', () => {
		const time = 123456
		const byteList = [0x19, 0x50]

		vi.spyOn(internals, 'parseCmd').mockImplementation(() => true)
		const parseMidrow = vi.spyOn(internals, 'parseMidrow')
		const parsePAC = vi.spyOn(internals, 'parsePAC')
		const parseBackgroundAttributes = vi.spyOn(internals, 'parseBackgroundAttributes')
		const parseChars = vi.spyOn(internals, 'parseChars')

		parser.addData(time, byteList)

		equal(parseMidrow.mock.calls.length, 0)
		equal(parsePAC.mock.calls.length, 0)
		equal(parseBackgroundAttributes.mock.calls.length, 0)
		equal(parseChars.mock.calls.length, 0)
	})

	it('adds data correctly, parseMidrow', () => {
		const time = 123456
		const byteList = [0x19, 0x50]

		const parseCmd = vi.spyOn(internals, 'parseCmd').mockImplementation(() => false)
		vi.spyOn(internals, 'parseMidrow').mockImplementation(() => true)
		const parsePAC = vi.spyOn(internals, 'parsePAC')
		const parseBackgroundAttributes = vi.spyOn(internals, 'parseBackgroundAttributes')
		const parseChars = vi.spyOn(internals, 'parseChars')

		parser.addData(time, byteList)

		equal(parseCmd.mock.calls.length, 1)
		equal(parsePAC.mock.calls.length, 0)
		equal(parseBackgroundAttributes.mock.calls.length, 0)
		equal(parseChars.mock.calls.length, 0)
	})

	it('adds data correctly, parsePAC', () => {
		const time = 123456
		const byteList = [0x19, 0x50]

		const parseCmd = vi.spyOn(internals, 'parseCmd').mockImplementation(() => false)
		const parseMidrow = vi.spyOn(internals, 'parseMidrow').mockImplementation(() => false)
		const parsePAC = vi.spyOn(internals, 'parsePAC').mockImplementation(() => true)
		const parseBackgroundAttributes = vi.spyOn(internals, 'parseBackgroundAttributes')
		const parseChars = vi.spyOn(internals, 'parseChars')

		parser.addData(time, byteList)

		equal(parseCmd.mock.calls.length, 1)
		equal(parseMidrow.mock.calls.length, 1)
		equal(parsePAC.mock.calls.length, 1)
		equal(parseBackgroundAttributes.mock.calls.length, 0)
		equal(parseChars.mock.calls.length, 0)
	})

	it('adds data correctly, parseBackgroundAttributes', () => {
		const time = 123456
		const byteList = [0x19, 0x50]

		const parseCmd = vi.spyOn(internals, 'parseCmd').mockImplementation(() => false)
		const parseMidrow = vi.spyOn(internals, 'parseMidrow').mockImplementation(() => false)
		const parsePAC = vi.spyOn(internals, 'parsePAC').mockImplementation(() => false)
		const parseBackgroundAttributes = vi
			.spyOn(internals, 'parseBackgroundAttributes')
			.mockImplementation(() => true)
		const parseChars = vi.spyOn(internals, 'parseChars')

		parser.addData(time, byteList)

		equal(parseCmd.mock.calls.length, 1)
		equal(parseMidrow.mock.calls.length, 1)
		equal(parsePAC.mock.calls.length, 1)
		equal(parseBackgroundAttributes.mock.calls.length, 1)
		equal(parseChars.mock.calls.length, 0)
	})

	it('adds data correctly, parseChars', () => {
		const time = 123456
		const byteList = [0x19, 0x50]

		const parseCmd = vi.spyOn(internals, 'parseCmd').mockImplementation(() => false)
		const parseMidrow = vi.spyOn(internals, 'parseMidrow').mockImplementation(() => false)
		const parsePAC = vi.spyOn(internals, 'parsePAC').mockImplementation(() => false)
		const parseBackgroundAttributes = vi
			.spyOn(internals, 'parseBackgroundAttributes')
			.mockImplementation(() => false)
		const parseChars = vi.spyOn(internals, 'parseChars').mockImplementation(() => [])

		parser.addData(time, byteList)

		equal(parseCmd.mock.calls.length, 1)
		equal(parseMidrow.mock.calls.length, 1)
		equal(parsePAC.mock.calls.length, 1)
		equal(parseBackgroundAttributes.mock.calls.length, 1)
		equal(parseChars.mock.calls.length, 1)
	})

	it('parse CMD method', () => {
		const byteCanParseByCmd = 0x17
		const byteCantParseByCmd = 0x20
		equal(internals.parseCmd(byteCanParseByCmd, byteCantParseByCmd), false)
	})

	it('interpretPAC method', () => {
		const row = 1
		const byteToChangeIndent = 0x10

		const defaultPacData: PACData = {
			color: null,
			italics: false,
			indent: null,
			underline: false,
			row: row,
		}

		deepEqual(internals.interpretPAC(row, byteToChangeIndent), defaultPacData)
	})

	it('interpretPAC method', () => {
		const row = 1
		const byteToUnderlineStyles = 0x01

		const pacDataUnderline: PACData = {
			color: null,
			italics: false,
			indent: null,
			underline: true,
			row: row,
		}

		deepEqual(internals.interpretPAC(row, byteToUnderlineStyles), pacDataUnderline)
	})
})
