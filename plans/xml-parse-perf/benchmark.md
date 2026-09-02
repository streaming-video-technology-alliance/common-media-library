# Benchmark methodology

Harness (TypeScript, run directly with Node 24): generate the input, load each parser variant as an ES module
exporting `parseXml`, run 4 warm-up plus N measured iterations interleaving variants on every iteration, and
report min / median / avg / p95 with `performance.now()`. Force `gc()` before each timed call to isolate
parser CPU cost, and also run without forced GC to see realistic medians; report both.

Generator parameters (the issue's shape):

- 50 Periods x 4 AdaptationSets x 500 `<S>` = 100,000 `<S>` elements
- two-space indentation, `<S>` at depth 5 (MPD > Period > AdaptationSet > SegmentTemplate > SegmentTimeline)
- `<S>` forms cycle: first `<S t="<t>" d="180000" />`, then `<S d="180000" r="14" />`,
  `<S d="180000" r="-1" k="3" />`, `<S d="180000" />`
- options: `pretty` (indentation and newlines on/off) and `closed` (`<S ...></S>` instead of `<S ... />`)
- video AdaptationSets carry `<Representation ... />` with 7 attributes, audio ones with 4

Sizes: 3,469,548 bytes pretty, 2,359,445 minified, 3,669,548 pretty with close tags. The issue's file was
2,813,392 bytes (shallower indentation).

Also useful: 60 Periods x 2 AS x 20 S with close tags (148,698 bytes) approximates the livesim2
`periods_60` manifest; the `bbb_30fps.mpd` fixture (3 KB) covers the small-manifest case.

Equivalence corpus used to verify that a variant produces identical output (`assert.deepStrictEqual`,
which handles the `parentElement` cycles): synthetic pretty/minified/closed (2x2x40), both test fixtures,
NBSP-only text, entities in text and attributes, mixed content, attribute spacing and quote styles,
doctype with internal subset, comments, CDATA, namespaces, top-level text, vertical tab and form feed
text, raw NBSP, empty input, whitespace-only input, unclosed element, unclosed element with text, empty
element, mismatched close tag (throws), declaration, trailing whitespace, trailing text, CRLF, whitespace
then text, long whitespace runs. Each input is run with `{}`, `{ keepWhitespace }`, `{ keepComments }`,
`{ includeParentElement }`, all three, and `{ pos: 3 }`.

Where to put it for the implementation PR: a `libs/xml/bench/` folder with a `bench` npm script is the
least intrusive option. Keep it out of the `**/*.test.ts` glob and note that `eslint .` lints everything
except `dist`.
