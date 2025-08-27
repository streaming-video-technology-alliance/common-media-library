import { after, before, describe } from 'node:test';

const TD = TextDecoder;

export function decoderTest(name: string, test: () => void | Promise<void>): void {
	describe(`${name} with TextDecoder`, () => {
		test();
	});

	describe(`${name} without TextDecoder`, () => {
		before(() => {
			globalThis.TextDecoder = undefined as any;
		});

		after(() => {
			globalThis.TextDecoder = TD;
		});

		test();
	});
}
