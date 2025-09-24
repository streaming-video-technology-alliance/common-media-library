import type { CueHandler } from '@svta/common-media-library/608';
import { CaptionScreen, Cta608Channel } from '@svta/common-media-library/608';
import { deepEqual, equal } from 'node:assert';
import { beforeEach, describe, it } from 'node:test';

describe('Cea608Channel Tests', () => {
	const channelNumber = 1;
	const outputFilter = {} as CueHandler;

	let channel: Cta608Channel;

	beforeEach(() => {
		channel = new Cta608Channel(channelNumber, outputFilter);
	});

	it('Create channel correctly', () => {
		const NR_ROWS = 15;
		equal(channel.chNr, channelNumber);
		equal(channel.outputFilter, outputFilter);
		equal(channel.mode, null);
		deepEqual(channel.displayedMemory, new CaptionScreen());
		deepEqual(channel.nonDisplayedMemory, new CaptionScreen());
		deepEqual(channel.lastOutputScreen, new CaptionScreen());
		deepEqual(channel.currRollUpRow, channel.displayedMemory.rows[NR_ROWS - 1]);
		deepEqual(channel.writeScreen, channel.displayedMemory);
		equal(channel.mode, null);
		equal(channel.cueStartTime, null);
	});

	it('getHandler correctly', () => {
		deepEqual(channel.getHandler(), outputFilter);
	});

	it('setHandler correctly', () => {
		deepEqual(channel.outputFilter, outputFilter);
		const newHandler = { OutputFilter: 'myOutputFilterAux' };
		channel.setHandler(newHandler as any);
		deepEqual(channel.outputFilter, newHandler);
	});

	it('setMode correctly', () => {
		const captionModeRollUp = 'MODE_ROLL-UP';
		equal(channel.mode, null);
		channel.setMode(captionModeRollUp);
		equal(channel.mode, captionModeRollUp);
	});
});
