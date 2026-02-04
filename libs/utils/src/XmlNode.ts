/**
 * XML node
 *
 * @public
 */
export type XmlNode = {
	nodeName: string;
	nodeValue: string | null;
	attributes: Record<string, string>;
	childNodes: XmlNode[];
	prefix?: string | null;
	localName?: string;
	parentElement?: XmlNode | null;
};
