# fix(iso-bmff): type the result of readIsoBoxes from the reader map

Stacked on #614. The base is `issue/611-iso-box-reader-return`. This file lives in `plans/` and is deleted before the merge.

## Description

### The defect

`readIsoBoxes(buffer, { readers: { ftyp: readFtyp } })` had a result type that contained every built-in box type. `box.type === 'tfdt'` compiled and narrowed to `baseMediaDecodeTime: number`. The runtime object had no such property. The view runs only the readers of the map. A box without a reader has `type`, `size`, and `view`, and a container box also has `boxes`.

`IsoBoxReaderReturn` added `ParsedBox<IsoBox | Box>` to every result. That member existed because `defaultReaderConfig()` returned the loose `IsoBoxReadViewConfig`. Its `readers` is `Record<IsoBoxType, IsoBoxReader>`, so a spread of that map added no literal key. The fallback member was the only way the default configuration kept the built-in types.

### The design

`defaultReaderConfig()` now returns `{ readers: DefaultReaderMap }`. The new public type lists the 60 built-in readers with `typeof`. The built-in types now come from the readers in the map, through the first member of `IsoBoxReaderReturn`. An intersection with `IsoBoxReadViewConfig` was tested and rejected. TypeScript infers `R` as `IsoBoxReaderMap & DefaultReaderMap` from that form, and the index signature then adds a member without `type` to the union.

`IsoBoxReaderReturn<R>` keeps its first member, the return types of the readers of `R`. A reader typed to return `unknown`, such as every value of a map typed `IsoBoxReaderMap`, now adds nothing. Before this change, such a map added a `ParsedBox<unknown>` member without `type`, and `box.type` did not compile. The second member depends on the keys of `R`:

- Literal keys: `ParsedBox<Exclude<IsoBoxContainer, { type: keyof R }> | Box>`. The container types without a reader in the map, and the header-only box type.
- A key that is not a literal, tested as `[IsoBoxType] extends [keyof R]`: `ParsedBox<IsoBox | Box>`. The map may contain a reader for any box.

The `Exclude<IsoBox, ...>` logic and the `url` and `urn` alias logic of #614 are gone. A `url` key narrows on `box.type === 'url '` through the return type of its reader.

**One deviation from the brief.** The brief described the literal-key fallback as `ParsedBox<Box>` only, and expected `moof` in the result of `defaultReaderConfig()`. The default map has no reader for a container, so that expectation needs the container types in the fallback. The view parses the children of a container without a reader, so the container types are part of the honest result. `box.type === 'moov'` compiles for every literal map, and `moov.boxes` is reachable.

**No configuration.** `readIsoBoxes(buffer)` now returns `ParsedBox<IsoBoxContainer | Box>[]` through a new overload. The overload with `config?: IsoBoxReadViewConfig` keeps `ParsedIsoBox[]`, because a configuration of that type may contain any reader.

### The break and the migration

Code that narrows the result of `readIsoBoxes` to a box type without a reader in the map no longer compiles. `box.type === 'mvhd'` with `{ ftyp: readFtyp }` is error TS2367. The runtime is unchanged. Migration, one of:

- Register the reader: `{ ftyp: readFtyp, mvhd: readMvhd }`.
- Pass `defaultReaderConfig()`.
- Spread `defaultReaderConfig().readers` and replace one entry.

The repo had one such site. `validateC2paInitSegment` in c2pa compared the boxes of a no-configuration read against `mdat`. It now registers `readMdat`. That reader calls `readData(-1)`, which returns a view over the box bytes without a copy. The c2pa changelog has the entry.

### The RFC question for Casey

AGENTS.md routes public API changes through an RFC. This change retypes `readIsoBoxes`, `IsoBoxReaderReturn`, and `defaultReaderConfig`, and it may break adopters. Casey asked for the fix directly, so this PR has no RFC. Decide whether the change needs one, or whether the changelog migration entry is enough for a type-only fix.

### Effect on RFC #613

The second pull request of RFC #613 adds the `int64` option and retypes `defaultReaderConfig` to take it. Section "Result type inference" of the RFC describes the `Exclude<IsoBox, ...>` form of the fix. That pull request must rebase onto this change. `DefaultReaderMap` becomes generic over the option, and the fallback logic here replaces the exclusion form of the RFC.

### Out of scope

- `traverseIsoBoxes`, `filterIsoBoxes`, and `findIsoBox` are generic over the element type and need no change.
- `createIsoBoxReadableStream`, the `IsoBoxReadView` iterator, `ParsedIsoBox`, and the test helpers `parseFile`, `findBox`, and `filterBoxes` keep `ParsedIsoBox`.
- The child types of the containers, such as `MovieBox.boxes: MovieBoxChild[]`, name built-in types that the map may not parse. A precise child type needs the box types to be generic over the reader map.

### Bundle

`libs/iso-bmff/dist/index.js` grows by 103 bytes. The difference is the TSDoc comment of `defaultReaderConfig`, which the bundle keeps. The code is identical after removing comments.

### Testing

`libs/iso-bmff/test/readIsoBoxes.test.ts` has a compile-time assertion and a runtime assertion on real bytes for each case:

- `{ ftyp: readFtyp }` gives `ParsedBox<FileTypeBox> | ParsedBox<IsoBoxContainer | Box>`. `box.type === 'mvhd'` is a compile error, marked `@ts-expect-error`. The `mvhd` child of `moov` has only `size`, `type`, and `view`.
- `defaultReaderConfig()` gives `tfdt` as `number`, `ftyp`, and `moof`.
- `{ ...defaultReaderConfig().readers, tfdt: readTfdt64 }` gives `bigint` for `tfdt` and keeps `ftyp` and `moof`.
- An optional custom reader gives its return type and the header-only types, with no `undefined` and without the built-in `tfdt` type.
- A computed key gives `ParsedIsoBox`.
- A map typed `IsoBoxReaderMap` gives `ParsedIsoBox`. New case.
- A `url` key narrows on `box.type === 'url '` through the return type of its reader.
- No configuration gives `ParsedBox<IsoBoxContainer | Box>`. `ftyp.type === 'ftyp'` is a compile error.

Against the previous types, the `dist` of the #614 head, the new test file fails with 15 type errors. After the change, the typecheck is clean.

Commands run at the root: `npm run build`, `npm run typecheck`, `npm test -w libs/iso-bmff` (127 tests), `npm run lint`, `npx vp fmt --check .`, the guide example check, `npm run build -w site`, and `npm test`.

Refs #611.

## Requirements Checklist

- [x] All commits have DCO sign-off from the author
- [x] Unit Tests updated or fixed
- [x] Docs/guides updated
- [x] Changelog notes added under `## [Unreleased]` in the `CHANGELOG.md` of each affected package
