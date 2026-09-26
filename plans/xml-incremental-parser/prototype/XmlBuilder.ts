/* eslint-disable @typescript-eslint/no-invalid-void-type -- `this: void` on the callbacks is deliberate (see below); the implementation PR enables allowAsThisParameter */

/**
 * Callbacks that build the result of a scan.
 *
 * The scanner calls `createDocument` once, unless a root value is supplied, then `createElement` when a
 * start tag has been read, `appendChild` when the element completes, and the other `append` callbacks as
 * text, CDATA sections, comments, and doctype declarations are read. Every callback receives the innermost
 * open element, or the document, as `parent`. `appendChild` also receives the child's tag name as written;
 * the text callbacks receive the parent's tag name, which is the empty string at document level.
 *
 * `createElement` may return `undefined` to skip the element: the scanner then reports nothing inside it
 * and does not call `appendChild` for it.
 *
 * Property syntax is deliberate: under `strictFunctionTypes` only property-typed functions check their
 * parameters contravariantly. `this: void` is deliberate too: the scanner calls the functions detached
 * from the builder object.
 */
export type XmlBuilder<TElement, TDocument = TElement> = {
	createDocument?: (this: void) => TDocument;
	createElement: (this: void, parent: TDocument | TElement, name: string, attributes: Record<string, string>, localName: string, prefix: string | null) => TElement | undefined;
	appendChild?: (this: void, parent: TDocument | TElement, child: TElement, name: string) => void;
	appendText?: (this: void, parent: TDocument | TElement, text: string, name: string) => void;
	appendCdata?: (this: void, parent: TDocument | TElement, text: string, name: string) => void;
	appendComment?: (this: void, parent: TDocument | TElement, text: string, name: string) => void;
	appendDoctype?: (this: void, parent: TDocument | TElement, text: string, name: string) => void;
};
