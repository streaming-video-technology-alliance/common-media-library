# @svta/cml-structured-field-values

RFC8941 Structured Field Values implementation.

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

assert(dict === `a=1, b=?0, c="x", d=y, e=:AQID:`);
```
