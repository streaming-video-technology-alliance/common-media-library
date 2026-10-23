import type { PACData } from '@svta/cml-608'
import { Cta608Parser } from '@svta/cml-608'
import { deepEqual, equal } from 'node:assert'
import { beforeEach, describe, it, vi } from 'vite-plus/test'

describe('Cea608Parser Tests', () => {
	let parser: any

	beforeEach(() => {
		parser = new Cta608Parser(1, null, null)
	})

	it('adds data correctly, parseCmd', () => {
		const time = 123456
		const byteList = [0x19, 0x50]

		vi.spyOn(parser, 'parseCmd').mockImplementation(() => true)
		const parseMidrow = vi.spyOn(parser, 'parseMidrow')
		const parsePAC = vi.spyOn(parser, 'parsePAC')
		const parseBackgroundAttributes = vi.spyOn(parser, 'parseBackgroundAttributes')
		const parseChars = vi.spyOn(parser, 'parseChars')

		parser.addData(time, byteList)

		equal(parseMidrow.mock.calls.length, 0)
		equal(parsePAC.mock.calls.length, 0)
		equal(parseBackgroundAttributes.mock.calls.length, 0)
		equal(parseChars.mock.calls.length, 0)
	})

	it('adds data correctly, parseMidrow', () => {
		const time = 123456
		const byteList = [0x19, 0x50]

		const parseCmd = vi.spyOn(parser, 'parseCmd').mockImplementation(() => false)
		vi.spyOn(parser, 'parseMidrow').mockImplementation(() => true)
		const parsePAC = vi.spyOn(parser, 'parsePAC')
		const parseBackgroundAttributes = vi.spyOn(parser, 'parseBackgroundAttributes')
		const parseChars = vi.spyOn(parser, 'parseChars')

		parser.addData(time, byteList)

		equal(parseCmd.mock.calls.length, 1)
		equal(parsePAC.mock.calls.length, 0)
		equal(parseBackgroundAttributes.mock.calls.length, 0)
		equal(parseChars.mock.calls.length, 0)
	})

	it('adds data correctly, parsePAC', () => {
		const time = 123456
		const byteList = [0x19, 0x50]

		const parseCmd = vi.spyOn(parser, 'parseCmd').mockImplementation(() => false)
		const parseMidrow = vi.spyOn(parser, 'parseMidrow').mockImplementation(() => false)
		const parsePAC = vi.spyOn(parser, 'parsePAC').mockImplementation(() => true)
		const parseBackgroundAttributes = vi.spyOn(parser, 'parseBackgroundAttributes')
		const parseChars = vi.spyOn(parser, 'parseChars')

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

		const parseCmd = vi.spyOn(parser, 'parseCmd').mockImplementation(() => false)
		const parseMidrow = vi.spyOn(parser, 'parseMidrow').mockImplementation(() => false)
		const parsePAC = vi.spyOn(parser, 'parsePAC').mockImplementation(() => false)
		const parseBackgroundAttributes = vi
			.spyOn(parser, 'parseBackgroundAttributes')
			.mockImplementation(() => true)
		const parseChars = vi.spyOn(parser, 'parseChars')

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

		const parseCmd = vi.spyOn(parser, 'parseCmd').mockImplementation(() => false)
		const parseMidrow = vi.spyOn(parser, 'parseMidrow').mockImplementation(() => false)
		const parsePAC = vi.spyOn(parser, 'parsePAC').mockImplementation(() => false)
		const parseBackgroundAttributes = vi
			.spyOn(parser, 'parseBackgroundAttributes')
			.mockImplementation(() => false)
		const parseChars = vi.spyOn(parser, 'parseChars').mockImplementation(() => true)

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
		equal(parser.parseCmd(byteCanParseByCmd, byteCantParseByCmd), false)
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

		deepEqual(parser.interpretPAC(row, byteToChangeIndent), defaultPacData)
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

		deepEqual(parser.interpretPAC(row, byteToUnderlineStyles), pacDataUnderline)
	})
})
