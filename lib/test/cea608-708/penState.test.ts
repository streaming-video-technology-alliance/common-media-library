import { PenState } from '@svta/common-media-library';
import { deepEqual, equal, notDeepEqual } from 'node:assert';
import { beforeEach, describe, it } from 'node:test';

describe('PenState Tests', () => {
	let penState: PenState;

	beforeEach(() => {
		penState = new PenState();
	});

	it('reset function', () => {
		const defaultPenState = new PenState();

		penState.foreground = 'black';
		penState.underline = true;
		penState.italics = true;
		penState.background = 'white';
		penState.flash = true;
	
		notDeepEqual(defaultPenState, penState);

		penState.reset();
		deepEqual(defaultPenState, penState);
	});

	it('setStyles foreground to blac', () => {
		equal(penState.foreground, 'white');

		penState.setStyles({ 'foreground': 'black' });
		equal(penState.foreground, 'black');
	});

	it('setStyles underline to true', () => {
		equal(penState.underline, false);

		penState.setStyles({ 'underline': true });
		equal(penState.underline, true);
	});

	it('setStyles italics to true', () => {
		equal(penState.italics, false);

		penState.setStyles({ 'italics': true });
		equal(penState.italics, true);
	});

	it('setStyles background to white', () => {
		equal(penState.background, 'black');

		penState.setStyles({ 'background': 'white' });
		equal(penState.background, 'white');
	});

	it('setStyles flash to true', () => {
		equal(penState.flash, false);

		penState.setStyles({ 'flash': true });
		equal(penState.flash, true);
	});

	it('isDefault function', () => {
		equal(penState.isDefault(), true);

		penState.foreground = 'black';
		equal(penState.isDefault(), false);
	});

	it('equals function', () => {
		const auxPenState = new PenState();
		equal(penState.equals(auxPenState), true);

		auxPenState.underline = true;
		equal(penState.equals(auxPenState), false);
	});

	it('copy function', () => {
		const auxPenState = new PenState();

		auxPenState.foreground = 'black';
		auxPenState.underline = true;
		auxPenState.italics = true;
		auxPenState.background = 'white';
		auxPenState.flash = true;


		equal(penState.equals(auxPenState), false);

		penState.copy(auxPenState);
		equal(penState.equals(auxPenState), true);
	});

	it('toString function', () => {
		const penStateString = penState.toString();
		const penStateStringExpected = 'color=white, underline=false, italics=false, background=black, flash=false';
		equal(penStateString, penStateStringExpected);
	});

});
