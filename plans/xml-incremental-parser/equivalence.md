# Equivalence and contract verification

`prototype/equivalence.ts` checks the phase-one prototype against the published parser. Phase one is the
scope of the RFC: the builder contract and `parseXmlWith`. Run the script from the repository root after
`npm run build -w libs/xml`:

```bash
node plans/xml-incremental-parser/prototype/equivalence.ts
```

## Result

778 checks, 0 failures, 34 expected differences (2026-09-03, against `main` at 5e4a82276).

## What is compared

1. **Parity.** The prototype `parseXml` against `@svta/cml-xml` from `main`, over the parity corpus of
   `libs/xml/test/parseXml.equivalence.test.ts`, plus three cases for the grammar fixes. The corpus is
   copied into the script, because that test module runs its tests on import. Each input is parsed with
   six option sets: `default`, `keepWhitespace`, `keepComments`, `includeParentElement`, all three
   together, and `pos: 3`. Trees are compared with `deepStrictEqual`. Errors are compared by message.
   Every difference must appear in `EXPECTED_DIFFERENCES`, with the option sets where it shows and a
   check of the new output. The other option sets of the same input must still be identical. Every error
   that the prototype throws is an `XmlParseError` with the same text that `main` produces.
2. **`parseXmlWith`.** On the 22 truncated corpus inputs, it throws `XmlParseError`. On every other
   input, it produces exactly what `parseXml` produces, with and without `keepWhitespace`.
3. **The builder contract.** Root injection (`createDocument` is not called, and `parseXmlWith` returns
   the root). The name argument on `appendChild` and the text callbacks. Skipping on `undefined` (no
   callbacks inside, close tags still checked). Untrimmed text, with blank runs dropped unless
   `keepWhitespace` is set. CDATA falling back to `appendText`. Inner text for comments and doctypes.
   `offset`, `line`, and `column` on `XmlParseError`.
4. **dash.js.** The faithful one-pass builder in `prototype/dash.ts` produces objects `deepStrictEqual`
   to `parseXml` plus the ported `processNode`, on the synthetic manifests, `bbb_30fps.mpd`, the
   livesim2 fixture, and a namespaced sample with CDATA, mixed content, and repeated `Location` elements.

## Expected differences from `main`

These are the grammar fixes and shape changes that the RFC proposes for both entry points. The
implementation regenerates exactly these fixture entries.

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

`pos3` starts parsing at index 3. For every one of these inputs, index 3 is inside the first tag, so the
`pos3` output is identical to `main`. The script checks that too.
