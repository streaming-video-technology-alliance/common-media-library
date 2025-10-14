# @svta/cml-xml

XML parsing utilities.

## Installation

```bash
npm i @svta/cml-xml
```

## Usage

```typescript
import { decodeXml } from "@svta/cml-xml";

const obj = decodeXml(
	`<root>
		<child>text</child>
		<ns:tag>content</ns:tag>
	</root>`
);

assert(obj.childNodes[0].nodeName === "root");
assert(obj.childNodes[0].childNodes[0].nodeName === "child");
assert(obj.childNodes[0].childNodes[0].childNodes[0].nodeValue === "text");
assert(obj.childNodes[0].childNodes[1].nodeName === "ns:tag");
assert(obj.childNodes[0].childNodes[1].prefix === "ns");
assert(obj.childNodes[0].childNodes[1].localName === "tag");
```
