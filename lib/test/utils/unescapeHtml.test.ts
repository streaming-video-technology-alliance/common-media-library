import { unescapeHtml } from '@svta/common-media-library/utils';
import assert, { equal } from 'node:assert';
import { describe, it } from 'node:test';

describe('unescapeHtml', () => {
	it('provides a valid example', async () => {
		//#region example
		const result = unescapeHtml('&quot;&lt;Hello&amp;World&gt;&quot;');

		assert(result === `"<Hello&World>"`);
		//#endregion example
	});

	it('handles special characters', () => {
		equal(unescapeHtml('hello &amp; world'), 'hello & world');
		equal(unescapeHtml(`&amp;,&lt;,&gt;,&quot;,&apos;,&nbsp;,&lrm;,&rlm;`), `&,<,>,",',\u{a0},\u{200e},\u{200f}`);
	});

	it('handles decimal special characters', () => {
		equal(unescapeHtml('hello &#70; world'), 'hello F world');
	});

	it('handles hex special characters', () => {
		equal(unescapeHtml('hello &#x44; world'), 'hello D world');
	});
});
