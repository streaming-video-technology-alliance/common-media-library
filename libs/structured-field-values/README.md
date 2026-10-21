# @svta/cml-structured-field-values

RFC8941 Structured Field Values implementation.

## When to use

- Decode an RFC 8941 header such as CMCD, CMSD, or Priority into items, lists, or dictionaries: `decodeSfDict`, `decodeSfList`, `decodeSfItem`
- Encode a dictionary, a list, or an item as a structured field header: `encodeSfDict`, `encodeSfList`, `encodeSfItem`
- Represent an item with parameters or a token: `SfItem`, `SfToken`
- Parse one component of a field, such as a bare item or an inner list: `parseBareItem`, `parseInnerList`, `parseParameters`
- Serialize one component of a field: `serializeBareItem`, `serializeInnerList`, `serializeParams`

Do not write your own structured field tokenizer or serializer. Open an issue for an RFC 8941 form that fails to parse.

## Installation

```bash
npm i @svta/cml-structured-field-values
```

## Usage

```typescript
import { encodeSfDict } from "@svta/cml-structured-field-values";

const dict = encodeSfDict({
	a: 1,
	b: false,
	c: "x",
	d: Symbol.for("y"),
	e: new Uint8Array([1, 2, 3]),
});

console.log(dict);
// a=1, b=?0, c="x", d=y, e=:AQID:
```
