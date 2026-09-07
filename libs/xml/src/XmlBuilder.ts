/**
 * Callbacks that build the result of a scan. `createElement` is called when a start tag has been read,
 * `appendChild` when the element's close tag has been read or the input has ended, and the other
 * `append` callbacks as text, CDATA sections, comments, and doctype declarations are read, each with
 * the innermost open element (or the document) as the parent. Comments are skipped without being
 * sliced when `appendComment` is undefined.
 */
export type XmlBuilder<T> = {
	createDocument: () => T;
	createElement: (parent: T, name: string, attributes: Record<string, string>, localName: string, prefix: string | null) => T;
	appendChild?: (parent: T, child: T) => void;
	appendText?: (parent: T, text: string) => void;
	appendCdata?: (parent: T, text: string) => void;
	appendComment?: (parent: T, text: string) => void;
	appendDoctype?: (parent: T, text: string) => void;
};
