import { parseXml } from '@svta/common-media-library';
import assert, { equal } from 'node:assert';
import { promises as fs } from 'node:fs';
import { describe, it } from 'node:test';

describe('parseXml', () => {
	it('parses DASH manifest', async () => {
		const xml = await fs.readFile('./test/xml/fixtures/bbb_30fps.mpd', 'utf8');
		const nodes = parseXml(xml);

		equal(nodes.length, 1);

		const root = nodes[0];
		assert(typeof root !== 'string');

		equal(root.tagName, 'MPD');
		equal(root.attributes['profiles'], 'urn:hbbtv:dash:profile:isoff-live:2012,urn:mpeg:dash:profile:isoff-live:2011');

		const firstChild = root.children[0];
		assert(typeof firstChild !== 'string');
		equal(firstChild.children[0], './');
	});

	it('parses all node types', async () => {
		const xml = await fs.readFile('./test/xml/fixtures/node_types.xml', 'utf8');
		const nodes = parseXml(xml);

		equal(nodes.length, 2);

		const doctype = nodes[0];
		equal(doctype, '!DOCTYPE html PUBLIC "-//W3C//DTD XHTML Basic 1.1//EN" "http://www.w3.org/TR/xhtml-basic/xhtml-basic11.dtd"');

		const root = nodes[1];
		assert(typeof root !== 'string');

		const firstChild = root.children[0];
		assert(typeof firstChild !== 'string');
		equal(firstChild.children[0], 'https://www.sample.com?test=123&hello=world');

		const htmlEntities = root.children[1];
		assert(typeof htmlEntities !== 'string');
		equal(htmlEntities.children[0], `&,<,>,",',\u{a0},\u{200e},\u{200f}`);
	});
});
