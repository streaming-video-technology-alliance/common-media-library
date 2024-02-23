import { Cea608Parser } from '@svta/common-media-library';
import { deepEqual, equal } from 'node:assert';
import { describe, it, beforeEach, mock } from 'node:test';

interface PACData {
    row: number;
    indent: number | null;
    color: string | null;
    underline: boolean;
    italics: boolean;
  }

describe('Cea608Parser Tests', () => {

	let parser: Cea608Parser;

	beforeEach(() => {
		parser = new Cea608Parser(1, null, null);
	});

	it('adds data correctly, parseCmd', () => {
		const time = 123456;
		const byteList = [0x19, 0x50];

		mock.method(parser, 'parseCmd', () => true);
		const parseMidrow = mock.method(parser, 'parseMidrow');
		const parsePAC = mock.method(parser, 'parsePAC');
		const parseBackgroundAttributes = mock.method(parser, 'parseBackgroundAttributes');
		const parseChars = mock.method(parser, 'parseChars');

		parser.addData(time, byteList);
        
		equal(parseMidrow.mock.calls.length, 0);
		equal(parsePAC.mock.calls.length, 0);
		equal(parseBackgroundAttributes.mock.calls.length, 0);
		equal(parseChars.mock.calls.length, 0);
	});

	it('adds data correctly, parseMidrow', () => {
		const time = 123456;
		const byteList = [0x19, 0x50];

		const parseCmd = mock.method(parser, 'parseCmd', () => false);
		mock.method(parser, 'parseMidrow', () => true);
		const parsePAC = mock.method(parser, 'parsePAC');
		const parseBackgroundAttributes = mock.method(parser, 'parseBackgroundAttributes');
		const parseChars = mock.method(parser, 'parseChars');

		parser.addData(time, byteList);
        
		equal(parseCmd.mock.calls.length, 1);
		equal(parsePAC.mock.calls.length, 0);
		equal(parseBackgroundAttributes.mock.calls.length, 0);
		equal(parseChars.mock.calls.length, 0);
	});

	it('adds data correctly, parsePAC', () => {
		const time = 123456;
		const byteList = [0x19, 0x50];

		const parseCmd = mock.method(parser, 'parseCmd', () => false);
		const parseMidrow = mock.method(parser, 'parseMidrow', () => false);
		const parsePAC = mock.method(parser, 'parsePAC', () => true);
		const parseBackgroundAttributes = mock.method(parser, 'parseBackgroundAttributes');
		const parseChars = mock.method(parser, 'parseChars');

		parser.addData(time, byteList);
        
		equal(parseCmd.mock.calls.length, 1);
		equal(parseMidrow.mock.calls.length, 1);
		equal(parsePAC.mock.calls.length, 1);
		equal(parseBackgroundAttributes.mock.calls.length, 0);
		equal(parseChars.mock.calls.length, 0);
	});

	it('adds data correctly, parseBackgroundAttributes', () => {
		const time = 123456;
		const byteList = [0x19, 0x50];

		const parseCmd = mock.method(parser, 'parseCmd', () => false);
		const parseMidrow = mock.method(parser, 'parseMidrow', () => false);
		const parsePAC = mock.method(parser, 'parsePAC', () => false);
		const parseBackgroundAttributes = mock.method(parser, 'parseBackgroundAttributes', () => true);
		const parseChars = mock.method(parser, 'parseChars');

		parser.addData(time, byteList);
        
		equal(parseCmd.mock.calls.length, 1);
		equal(parseMidrow.mock.calls.length, 1);
		equal(parsePAC.mock.calls.length, 1);
		equal(parseBackgroundAttributes.mock.calls.length, 1);
		equal(parseChars.mock.calls.length, 0);
	});

	it('adds data correctly, parseChars', () => {
		const time = 123456;
		const byteList = [0x19, 0x50];

		const parseCmd = mock.method(parser, 'parseCmd', () => false);
		const parseMidrow = mock.method(parser, 'parseMidrow', () => false);
		const parsePAC = mock.method(parser, 'parsePAC', () => false);
		const parseBackgroundAttributes = mock.method(parser, 'parseBackgroundAttributes', () => false);
		const parseChars = mock.method(parser, 'parseChars', () => true);

		parser.addData(time, byteList);
        
		equal(parseCmd.mock.calls.length, 1);
		equal(parseMidrow.mock.calls.length, 1);
		equal(parsePAC.mock.calls.length, 1);
		equal(parseBackgroundAttributes.mock.calls.length, 1);
		equal(parseChars.mock.calls.length, 1);
	});

	it('parse CMD method', () => {
		const byteCanParseByCmd = 0x17;
		const byteCantParseByCmd = 0x20;
		equal(parser.parseCmd(byteCanParseByCmd, byteCantParseByCmd), false);
	});

	it('interpretPAC method', () => {
		const row = 1;
		const byteToChangeIndent = 0x10;

		const defaultPacData: PACData = {
			color: null,
			italics: false,
			indent: null,
			underline: false,
			row: row,
		};
        
		deepEqual(parser.interpretPAC(row, byteToChangeIndent), defaultPacData);
	});

	it('interpretPAC method', () => {
		const row = 1;
		const byteToUnderlineStyles = 0x01;

		const pacDataUnderline: PACData = {
			color: null,
			italics: false,
			indent: null,
			underline: true,
			row: row,
		};
        
		deepEqual(parser.interpretPAC(row, byteToUnderlineStyles), pacDataUnderline);
	});
});
