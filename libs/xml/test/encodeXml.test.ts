import { encodeXml } from '@svta/cml-xml';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';

describe('encodeXml', () => {
	it('provides a valid example', async () => {
		//#region example
		const xml = {
			nodeName: '#document',
			nodeValue: null,
			attributes: {},
			childNodes: [
				{
					nodeName: 'root',
					nodeValue: null,
					attributes: {},
					childNodes: [
						{
							nodeName: 'child',
							nodeValue: null,
							attributes: {
								hello: 'world',
							} as Record<string, string>,
							childNodes: [
								{
									nodeName: '#text',
									nodeValue: 'text',
									attributes: {},
									childNodes: [],
								},
							],
						},
						{
							nodeName: 'ns:tag',
							nodeValue: null,
							attributes: {},
							childNodes: [
								{
									nodeName: '#text',
									nodeValue: 'content',
									attributes: {},
									childNodes: [],
								},
							],
						},
					],
				},
			],
		};

		equal(encodeXml(xml), '<?xml version="1.0" encoding="UTF-8"?><root><child hello="world">text</child><ns:tag>content</ns:tag></root>');
		//#endregion example
	});
});
