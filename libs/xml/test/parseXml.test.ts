import { parseXml } from '@svta/common-media-library';
import assert, { equal } from 'node:assert';
import { promises as fs } from 'node:fs';
import { describe, it } from 'node:test';

describe('parseXml', () => {
	it('provides a valid example', async () => {
		//#region example
		const obj = parseXml(
			`<root>
				<child>text</child>
				<ns:tag>content</ns:tag>
			</root>`,
		);
		assert(obj.childNodes[0].nodeName === 'root');
		assert(obj.childNodes[0].childNodes[0].nodeName === 'child');
		assert(obj.childNodes[0].childNodes[0].childNodes[0].nodeValue === 'text');
		assert(obj.childNodes[0].childNodes[1].nodeName === 'ns:tag');
		assert(obj.childNodes[0].childNodes[1].prefix === 'ns');
		assert(obj.childNodes[0].childNodes[1].localName === 'tag');
		//#endregion example
	});

	it('parses DASH manifest', async () => {
		const xml = await fs.readFile('./test/xml/fixtures/bbb_30fps.mpd', 'utf8');
		const doc = parseXml(xml);
		const { childNodes } = doc;

		equal(childNodes.length, 1);

		const root = childNodes[0];

		equal(root.nodeName, 'MPD');
		equal(root.attributes['profiles'], 'urn:hbbtv:dash:profile:isoff-live:2012,urn:mpeg:dash:profile:isoff-live:2011');

		const firstChild = root.childNodes[0];
		equal(firstChild.childNodes[0].nodeValue, './');
	});

	it('parses all node types', async () => {
		const xml = await fs.readFile('./test/xml/fixtures/node_types.xml', 'utf8');
		const doc = parseXml(xml);
		const { childNodes } = doc;
		equal(childNodes.length, 2);

		const doctype = childNodes[0].nodeValue;
		equal(doctype, '!DOCTYPE html PUBLIC "-//W3C//DTD XHTML Basic 1.1//EN" "http://www.w3.org/TR/xhtml-basic/xhtml-basic11.dtd"');

		const root = childNodes[1];
		const firstChild = root.childNodes[0];
		equal(firstChild.childNodes[0].nodeValue, 'https://www.sample.com?test=123&hello=world');

		const htmlEntities = root.childNodes[1];
		equal(htmlEntities.childNodes[0].nodeValue, `&,<,>,",',\u{a0},\u{200e},\u{200f}`);
		equal(htmlEntities.attributes['test'], `&,<,>,",',\u{a0},\u{200e},\u{200f}`);

		const namespace = root.childNodes[2];
		equal(namespace.nodeName, `tt:Text`);
		equal(namespace.prefix, `tt`);
		equal(namespace.localName, `Text`);
	});
});
