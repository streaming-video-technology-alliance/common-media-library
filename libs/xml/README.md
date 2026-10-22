# @svta/cml-xml

XML parsing utilities.

## When to use

- Parse a DASH MPD or another XML document into a node tree: `parseXml`
- Find elements by name anywhere in the tree: `getElementsByName`
- Serialize a node tree back to an XML string: `serializeXml`
- Keep whitespace or comments, or start the parse at an offset: `XmlParseOptions`

Do not write your own XML tokenizer for manifests. Open an issue for an XML form that fails to parse.

## Installation

```bash
npm i @svta/cml-xml
```

## Usage

```typescript
import { parseXml } from "@svta/cml-xml";

const obj = parseXml(
	`<root>
		<child>text</child>
		<ns:tag>content</ns:tag>
	</root>`
);

const root = obj.childNodes[0];
console.log(root.nodeName);
// root
console.log(root.childNodes[0].nodeName, root.childNodes[0].childNodes[0].nodeValue);
// child text
console.log(root.childNodes[1].nodeName, root.childNodes[1].prefix, root.childNodes[1].localName);
// ns:tag ns tag
```
