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

CTA-608 captions are embedded in the video elementary stream as an ATSC A/53 `cc_data()`
payload. Only the envelope around the payload differs by codec. The envelope is either a
supplemental enhancement information (SEI) message in a network abstraction layer (NAL)
unit, or an open bitstream unit (OBU). Choose the extractor that matches the sample entry
type:

| Sample entry            | Envelope                          | Extractor                          |
| ----------------------- | --------------------------------- | ---------------------------------- |
| `avc1` / `hvc1` / `vvc1` | `itu_t_t35` SEI message in a NAL  | `extractCta608DataFromSample`      |
| `av01`                  | `metadata_itu_t_t35` OBU          | `extractCta608DataFromAv1Sample`   |

Both extractors return the same `[field1, field2]` byte arrays. `Cta608Parser` renders
them as caption screens:

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

The two extractors are separate because the two envelopes are framed differently, and a
sample does not announce its framing. A NAL unit sample puts a fixed-width big-endian
length before each unit. Only `lengthSizeMinusOne` in the `avcC` or `hvcC` config gives
that width. An AV1 sample uses the low-overhead format. Each OBU has its own `obu_size`
after the header, and the last OBU may omit it. In both cases the sample entry gives the
framing.
