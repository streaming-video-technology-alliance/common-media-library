import type { XmlChildren } from './XmlChildren';

/**
 * XML node
 *
 * @group XML
 *
 * @beta
 */
export type XmlNode = {
	tagName: string;
	attributes: Record<string, string>;
	children: XmlChildren;
};
