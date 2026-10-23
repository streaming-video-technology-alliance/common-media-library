// Declarations that the example check prepends to the blocks of report-recorder-guide.md.
declare const recorder: import('@svta/cml-cmcd').CmcdReportRecorder
declare function startPlayer(): void
type Panel = { append(report: import('@svta/cml-cmcd').CmcdRecordedReport): void }
declare const manifestPanel: Panel
declare const segmentPanel: Panel
declare const eventPanel: Panel
type MyRequest = { url: string; method: string; headers: Record<string, string>; body?: string }
declare const myClient: { send(req: MyRequest): Response | Promise<Response> }
declare function normalize(req: MyRequest): import('@svta/cml-utils').HttpRequest
