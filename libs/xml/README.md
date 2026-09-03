0
0
# @svta/cml-xml

XML parsing utilities.

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
