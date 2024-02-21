import { Row, CaptionsLogger } from '@svta/common-media-library';
import { deepEqual, equal, notDeepEqual } from 'node:assert';
import { describe, it, beforeEach } from 'node:test';

describe('Row Tests', () => {
	const minCursorPosition = 0;
	const maxCursorPosition = 100;

	const logger = new CaptionsLogger();
	let row: Row;

	beforeEach(() => {
		row = new Row(logger);
	});

	it('should initialize with empty characters and default state', () => {
		for (let i = 0; i < row.chars.length; i++) {
			equal(row.chars[i].isEmpty(), true);
		}
		equal(row.pos, 0);
	});

	it('equals method', () => {
		const defaultRow = new Row(logger);
		deepEqual(row, defaultRow);

		row.pos = 1;

		notDeepEqual(row, defaultRow);
	});

	it('copy method', () => {
		const newRow = new Row(logger);

		row.chars[0].setChar('A', row.currPenState);
		row.chars[1].setChar('B', row.currPenState);
		row.chars[2].setChar('C', row.currPenState);
      
		newRow.copy(row);
      
		for (let i = 0; i < newRow.chars.length; i++) {
			equal(newRow.chars[i].equals(row.chars[i]), true);
		}
      
	});

	it('isEmpty method', () => {
		equal(row.isEmpty(), true);
      
		row.chars[0].setChar('A', row.currPenState);
		equal(row.isEmpty(), false);
	});

	it('setCursor method, negative position', () => {
		row.setCursor(-1);
		equal(row.pos, minCursorPosition);
	});

	it('setCursor method, big position', () => {
		row.setCursor(1000);
		equal(row.pos, maxCursorPosition);
	});
});
