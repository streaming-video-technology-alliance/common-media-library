# Example typecheck: block inventory

Every failing block, by file. The line is the line of the opening fence in the markdown file. The fixes were verified with the strict compiler settings on 2026-10-22. Blocks that are not listed pass.

## Fix kinds

| Kind | Blocks |
| - | - |
| Declare a value that the reader's code provides | 45 |
| Add a missing import without a declaration | 12 |
| Fix wrong code | 7 |
| Mark an intentional compile error | 2 |

Some blocks need more than one kind. The totals per package are iso-bmff 5, c2pa 12, and cmcd 34.

## Conventions

- A `declare` line goes after the imports and before the first statement.
- The cmcd guides use double quotes and semicolons. The c2pa guides use single quotes and no semicolons. Keep the style of the file.
- `reporter` is declared as `declare const reporter: CmcdReporter;` with `import { CmcdReporter } from "@svta/cml-cmcd";`.
- `recorder` is declared as `declare const recorder: CmcdReportRecorder;`.
- `startPlayer` is declared as `declare function startPlayer(): void;`.
- c2pa values: `declare const initUrl: string`, `declare const segmentUrls: string[]`, `declare const init: InitSegmentValidation`, `declare const result: SegmentValidationResult`. The two types come from `import type { ... } from '@svta/cml-c2pa'`.

## libs/cmcd/docs/user-guide.md

| Line | Missing or wrong | Fix |
| - | - | - |
| 83 | `reporter` | Import `CmcdReporter`. Declare `reporter`. |
| 116 | `reporter` | Import `CmcdReporter`. Declare `reporter`. |
| 168 | `reporter`, `toCmcdValue` | Import `CmcdReporter, toCmcdValue`. Declare `reporter`. |
| 181 | `reporter`, `toCmcdValue` | Import `CmcdReporter, toCmcdValue`. Declare `reporter`. |
| 207 | `reporter` | Import `CmcdReporter`. Declare `reporter`. |
| 312 | `reporter` | Add `CmcdReporter` to the import. Declare `reporter`. |
| 352 | `reporter` | Import `CmcdReporter`. Declare `reporter`. |
| 360 | `reporter` | Import `CmcdReporter`. Declare `reporter`. |
| 378 | `reporter`, `CmcdEventType` | Import `CmcdEventType, CmcdReporter`. Declare `reporter`. |
| 393 | `reporter`, `CmcdEventType` | Import `CmcdEventType, CmcdReporter`. Declare `reporter`. |
| 479 | `reporter`, `decoratedRequest`, `resourceTiming` lacks the required `encodedBodySize` | Import `CmcdReporter`. Declare `reporter`. Add `const decoratedRequest = reporter.createRequestReport({ url: "https://cdn.example.com/segment.mp4" });`. Add `encodedBodySize: 512000,` to `resourceTiming`. |
| 498 | `reporter`, `SegmentInfo`, `this` in a free function (TS2683), `encodedBodySize` | Import `CmcdReporter` and `import type { CmcdObjectType }`. Declare `reporter`. Add `declare const player: { getBufferLength(): number; getMeasuredThroughput(): number };` and `type SegmentInfo = { bitrate: number; duration: number; type: CmcdObjectType };`. Replace `this.` with `player.`. Add `encodedBodySize: buffer.byteLength,` to `resourceTiming`. |
| 545 | `reporter`, `response` | Import `CmcdReporter`. Declare `reporter`. Add `const response = { status: 200, request: reporter.createRequestReport({ url: "https://cdn.example.com/segment.mp4" }) };`. |
| 629 | `reporter` | Import `CmcdReporter`. Declare `reporter`. |
| 639 | `reporter` | Import `CmcdReporter`. Declare `reporter`. |
| 647 | `reporter` | Import `CmcdReporter`. Declare `reporter`. |
| 656 | `reporter` | Import `CmcdReporter`. Declare `reporter`. |
| 677 | `reporter`, `request` | Add `CmcdReporter` to the import. Declare `reporter`. Add `const request = reporter.createRequestReport({ url: "https://cdn.example.com/segment.mp4" });`. |
| 696 | `reporter`, `request`, `CMCD_REQUEST_PROVENANCE` | Import `CmcdReporter, CMCD_REQUEST_PROVENANCE` and `import type { HttpRequest } from "@svta/cml-utils"`. Declare `reporter`. Add `declare const request: HttpRequest & { customData: Record<symbol, unknown> };`. |
| 704 | `CmcdReporter`, `CmcdEventType` | Import both. |
| 739 | `CmcdEventType`, `axios`, `request` parameter is implicit `any` | Add `CmcdEventType` to the import. Add `import type { HttpRequest } from "@svta/cml-utils"`. Add `declare function axios(config: { url: string; method?: string; headers?: Record<string, string>; data?: unknown }): Promise<{ status: number }>;`. Type the parameter: `async (request: HttpRequest) =>`. |
| 771 | `CmcdEventType`, unused `CMCD_KEYS` | Replace `CMCD_KEYS` with `CmcdEventType` in the import. |
| 841 | `sampleIntervals` | Add `declare function sampleIntervals(data: Cmcd): Cmcd \| null;`. |
| 899 | `reporter`, intentional error | Import `CmcdReporter`. Add `type PlayerData = { requestType: "segment" \| "manifest" \| "license" };` and `declare const reporter: CmcdReporter<PlayerData>;`. Add `// @ts-expect-error` on the line above `customData: { requestTypo: "segment" },`. |
| 909 | `CmcdEventReportTransform`, intentional error | Add `import type { CmcdEventReportTransform } from "@svta/cml-cmcd";`. Add `// @ts-expect-error` on the line above `if (customData) customData.timing.start = 0;`. |

## libs/cmcd/docs/validation-guide.md

| Line | Missing or wrong | Fix |
| - | - | - |
| 23 | `CmcdValidationSeverity` | Add `import type { CmcdValidationSeverity } from "@svta/cml-cmcd";`. |

## libs/cmcd/docs/report-recorder-guide.md

| Line | Missing or wrong | Fix |
| - | - | - |
| 61 | `HttpRequest`, `CmcdRecordedRequestType`, `CmcdRecordedReportMode` | Add `import type { CmcdRecordedReportMode, CmcdRecordedRequestType } from "@svta/cml-cmcd";` and `import type { HttpRequest } from "@svta/cml-utils";`. |
| 110 | `startPlayer` | Declare `startPlayer`. |
| 130 | `recorder`, `CmcdReportRecorder` | Import `CmcdReportRecorder`. Declare `recorder`. |
| 168 | `recorder`, `CmcdRecordedRequestType`, three panels, `report` is implicit `any` | Add `import { CmcdReportRecorder, CmcdRecordedRequestType, type CmcdRecordedReport } from "@svta/cml-cmcd";`. Add `type Panel = { append(report: CmcdRecordedReport): void };`. Declare `recorder`, `manifestPanel: Panel`, `segmentPanel: Panel`, `eventPanel: Panel`. The `report` parameter is typed by `recorder`. |
| 192 | `startPlayer` | Declare `startPlayer`. |
| 217 | `startPlayer` | Declare `startPlayer`. |
| 241 | `startPlayer` | Declare `startPlayer`. |
| 267 | `myClient`, `MyRequest`, `normalize` | Add `type MyRequest = { url: string; method: string; headers: Record<string, string>; body?: string };`, `declare const myClient: { send(req: MyRequest): Promise<Response> };`, and `declare function normalize(req: MyRequest): HttpRequest;`. Change `return stub;` to `return Promise.resolve(stub);`. |

## libs/c2pa/docs/manifest-box-validation.md

| Line | Missing or wrong | Fix |
| - | - | - |
| 23 | `segmentUrls` | Declare `segmentUrls`. |
| 154 | `validateC2paManifestBoxSegment`, `bytes`, `lastManifestId`, `state`, `verifyAnchorChain`, two implicit `any` parameters | Add `import { validateC2paManifestBoxSegment, type ManifestBoxValidationState } from '@svta/cml-c2pa'`. Add `declare const bytes: Uint8Array`, `declare const lastManifestId: string \| null`, `declare const state: ManifestBoxValidationState \| undefined`, and `declare function verifyAnchorChain(anchorToken: unknown, instanceId: string \| null): boolean`. The import types the two parameters. |

## libs/c2pa/docs/merkle-validation.md

| Line | Missing or wrong | Fix |
| - | - | - |
| 23 | `initUrl` | Declare `initUrl`. |
| 43 | `segmentUrls`, `init` | Add `InitSegmentValidation` to the type import. Declare `segmentUrls` and `init`. |

## libs/c2pa/docs/results-and-error-codes.md

| Line | Missing or wrong | Fix |
| - | - | - |
| 14 | `result` | Import type `SegmentValidationResult`. Declare `result`. |
| 66 | `result` | Import type `SegmentValidationResult`. Declare `result`. |
| 158 | `init` | Import type `InitSegmentValidation`. Declare `init`. |
| 195 | `result` | Import type `SegmentValidationResult`. Declare `result`. |

## libs/c2pa/docs/vsi-validation.md

| Line | Missing or wrong | Fix |
| - | - | - |
| 21 | `initUrl` | Declare `initUrl`. |
| 50 | `init` | Import type `InitSegmentValidation`. Declare `init`. |
| 74 | `init`, `segmentUrls` | Add `InitSegmentValidation` to the type import. Declare `init` and `segmentUrls`. |
| 237 | `result` | Import type `SegmentValidationResult`. Declare `result`. |

## libs/iso-bmff/docs/utilities.md

| Line | Missing or wrong | Fix |
| - | - | - |
| 12 | `buffer`. `traverseIsoBoxes` takes an iterable of boxes, not bytes. | Replace the block body with: `import { readIsoBoxes, traverseIsoBoxes } from "@svta/cml-iso-bmff";` `declare const bytes: Uint8Array;` `const boxes = readIsoBoxes(bytes);` `for (const box of traverseIsoBoxes(boxes)) { console.log(box.type); }`. |
| 24 | `{ type: "meta", boxes: [] }` is not a valid box (TS2345) | Add `type IsoBox` to the import. Replace the object with `const box: IsoBox = { type: "meta", version: 0, flags: 0, boxes: [] };`. |

The `isFullBox` block at line 33 passes, because `isFullBox` accepts `any`. Leave the block unchanged.

## libs/iso-bmff/docs/writing-boxes.md

| Line | Missing or wrong | Fix |
| - | - | - |
| 22 | `sourceBuffer`. The array literal widens `type` to `string` (TS2345). `byteArray.buffer` is `ArrayBufferLike`, which `appendBuffer` rejects. | Add `type IsoBoxStreamable` to the import. Add `declare const sourceBuffer: SourceBuffer;`. Annotate `const boxes: IsoBoxStreamable[] = [`. Change `sourceBuffer.appendBuffer(byteArray.buffer)` to `sourceBuffer.appendBuffer(byteArray)`. |
| 53 | Same three problems | Same three changes. |
| 93 | `webTransport` and `transport` name the same object. `transport.writable` does not exist on `WebTransport`. The array literal widens `type`. | Add `type IsoBoxStreamable` to the import. Add `declare const transport: WebTransport;`. Annotate `const boxes: IsoBoxStreamable[] = [`. Change the last two lines to `const stream = await transport.createBidirectionalStream();` and `readableStream.pipeTo(stream.writable);`. |

## Prose that names a changed identifier

- `libs/iso-bmff/docs/utilities.md` line 10 says the function "takes an iterable of boxes". The new block matches the sentence. No prose change.
- `libs/iso-bmff/docs/writing-boxes.md`: check the sentences around line 93 for the word `webTransport`. Replace with `transport` if present.
- `libs/cmcd/docs/user-guide.md`: the table at line 475 lists `response.resourceTiming` fields. Add `encodedBodySize` only if the table claims to be complete.
