# @svta/cml-608

CTA-608/CEA-608 closed captioning functionality.

## Installation

```bash
npm i @svta/cml-608
```

## Usage

```typescript
import { CaptionScreen, Row } from "@svta/cml-608";
```

### Extracting captions from a media sample

CTA-608 captions ride inside the video elementary stream as an ATSC A/53 `cc_data()`
payload. The payload is the same for every codec; only the envelope around it differs, so
pick the extractor that matches the sample entry type:

| Sample entry            | Envelope                          | Extractor                          |
| ----------------------- | --------------------------------- | ---------------------------------- |
| `avc1` / `hvc1` / `vvc1` | `itu_t_t35` SEI message in a NAL  | `extractCta608DataFromSample`      |
| `av01`                  | `metadata_itu_t_t35` OBU          | `extractCta608DataFromAv1Sample`   |

Both return the same `[field1, field2]` byte arrays, which `Cta608Parser` turns into
rendered caption screens:

```typescript
import { Cta608Parser, extractCta608DataFromAv1Sample } from "@svta/cml-608";

const parser = new Cta608Parser(1, {
	newCue(startTime, endTime, screen) {
		console.log(startTime, endTime, screen.getDisplayText());
	},
}, null);

const [field1] = extractCta608DataFromAv1Sample(view, samplePos, sampleSize);
if (field1.length) {
	parser.addData(sampleTimeMs, field1);
}
```

These are separate functions rather than one auto-detecting call because the two carriages
are framed differently and neither sample announces which it is. A NAL unit sample puts a
fixed-width big-endian length in front of each unit, and that width is only known from
`lengthSizeMinusOne` in the `avcC`/`hvcC` config. An AV1 sample uses the low-overhead
format, where each OBU carries its own `obu_size` after the header — and may omit it on
the last OBU. Either way the framing has to come from the sample entry, so pass the bytes
to the extractor that matches it.
