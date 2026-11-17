# Issues filed from the audit

Each row maps findings of `findings.md` to a GitHub issue. Most rows cover the group "New functions and new box types" and the group "Other packages and repository files". Briefs 1 and 2 filed the last three rows.

| Findings | Issue | Subject |
| --- | --- | --- |
| G466 | 683 | drm: `parsePsshList` does not return for a box with a size of 0 |
| F436 | 686 | Sample entry types in the default readers and writers |
| F435 | 687 | Readers and writers for the child boxes of a sample entry |
| F440 (first part) | 688 | Functions that decode and encode sample flags |
| F440 (second part), G479 | 689 | A function that resolves the samples of a fragment |
| F441 | 690 | A function that converts a `sidx` box to segment references |
| F439 | 691 | A guide example for the track facts of an init segment |
| F218 | 692 | Names for the flag bits of `tfhd`, `trun`, and `tkhd` |
| F434 | 693 | How to continue a read after a truncated box |
| F438 | 694 | A helper that selects the reader of a `uuid` box |
| F442, G474 | 695 | Point to drm for the pssh box of a key system |
| G464 | 696 | A step over sibling boxes that parses no content |
| G465 | 697 | c2pa: read JUMBF boxes with `readRootBoxes` |
| G472, G478 | 698 | drm and c2pa: update the code that uses iso-bmff |
| G477 | 699 | Delete or rewrite `dev/isobmff.html` |
| G475 | 700 | The skill describes `main` and not the npm version |
| G467 | 701 | c2pa: the `mdat` check and the hash read different boxes |
| F121 | 710 | iso-bmff: `readTrun` allocates one object for each sample with no limit on `sample_count` |
| F317 | 711 | Measure `sideEffects: false` with webpack for the published packages |
| F387 (part B) | 712 | `package.json`: `authors` is not an npm field, and `publishConfig.scope` has no effect |
