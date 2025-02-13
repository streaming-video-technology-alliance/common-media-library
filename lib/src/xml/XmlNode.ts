
/**
 * XML node
 *
 * @group XML
 *
 * @beta
 */
export type XmlNode = {
	nodeName: string;
	nodeValue: string | null;
	attributes: Record<string, string>;
	childNodes: XmlNode[];
};
