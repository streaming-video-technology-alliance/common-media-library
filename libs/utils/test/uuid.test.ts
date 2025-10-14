import { uuid } from '@svta/cml-utils';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';

describe('UUID generation', () => {
	const regex = /^[A-F\d]{8}-[A-F\d]{4}-4[A-F\d]{3}-[89AB][A-F\d]{3}-[A-F\d]{12}$/i;
	const id = uuid();

	it('is formatted correctly', () => {
		equal(regex.test(id), true);
	});

	it('produces unique IDs', () => {
		equal(uuid() == id, false);
	});
});
