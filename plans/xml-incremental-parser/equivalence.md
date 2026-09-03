# Equivalence and contract verification

`prototype/equivalence.ts` checks the phase-one prototype against the published parser. Run it from the
repository root after `npm run build -w libs/xml`:

```bash
node plans/xml-incremental-parser/prototype/equivalence.ts
```

## Result

778 checks, 0 failures, 34 expected differences observed (2026-09-03, against `main` at 5e4a82276).

## What is compared

1. **Parity.** The prototype `parseXml` against `@svta/cml-xml` from `main` over the parity corpus of
   `libs/xml/test/parseXml.equivalence.test.ts` (copied into the script, since that module runs tests on
   import) plus three cases for the grammar fixes, with the six option sets (`default`, `keepWhitespace`,
   `keepComments`, `includeParentElement`, all three, `pos: 3`). Trees compare with `deepStrictEqual`,
   errors by message. Every difference must appear in `EXPECTED_DIFFERENCES` with the option sets where it
   shows and a check of the new output; the other option sets of the same input must still be identical.
   Every error the prototype throws is an `XmlParseError` with the text `main` produces.
2. **`buildXml`.** On the 22 truncated corpus inputs it throws `XmlParseError`; on every other input it
   produces exactly what `parseXml` produces, with and without `keepWhitespace`.
3. **The builder contract.** Root injection (`createDocument` not called, `buildXml` returns the root),
   the name argument on `appendChild` and the text callbacks, skipping on `undefined` (no callbacks inside,
   close tags still checked), untrimmed text with blank runs dropped unless `keepWhitespace`, CDATA falling
   back to `appendText`, inner text for comments and doctypes, and `offset`, `line`, `column` on
   `XmlParseError`.
4. **dash.js.** The faithful one-pass builder in `prototype/dash.ts` produces objects `deepStrictEqual` to
   `parseXml` plus the ported `processNode` on the synthetic manifests, `bbb_30fps.mpd`, the livesim2
   fixture, and a namespaced sample with CDATA, mixed content, and repeated `Location` elements.

## Expected differences from `main`

These are the grammar fixes and shape changes the RFC proposes for both entry points. The implementation
regenerates exactly these fixture entries.

| Corpus input | Option sets | Reason |
|---|---|---|
| `digits and underscore attrs` (`<a 1b="x" _c="y" d="z"/>`) | all but `pos3` | `_c` is an attribute; `main` skipped the `_` and read `c` |
| `non-letter attribute name then letter` (`<a 😀="x" b="y"/>`) | all but `pos3` | U+1F600 is a NameStartChar; `main` skipped it and then threw on `x"` |
| `colon-start attribute` (`<a :b="1"/>`, new) | all but `pos3` | `:b` is an attribute; `main` skipped the colon |
| `pi with gt in value` (`<a><?pi x>y?></a>`) | all but `pos3` | the processing instruction ends at `?>`; `main` reported `y?>` as text |
| `pi with gt then element` (`<?pi a > b?><root/>`, new) | all but `pos3` | same; `main` reported ` b?>` as document-level text |
| `doctype with quoted gt` (`<!DOCTYPE a SYSTEM "x>y"><a/>`, new) | all but `pos3` | a `>` inside a quoted literal does not end the doctype |
| `truncated comment` (`<a><!-- x`) | `keepComments`, `all` | comments are delivered as inner text and the tree builder adds `<!--` and `-->`, also to a comment cut off by the end of input |
| `comments` (contains `<!--->`) | `keepComments`, `all` | `<!--->` has no inner text and is reported as `<!---->` |

`pos3` starts parsing at index 3, which lands inside the first tag of every one of these inputs, so their
outputs there are identical to `main` and are checked as such.
