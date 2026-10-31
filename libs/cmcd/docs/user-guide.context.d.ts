// Declarations that the example check prepends to the blocks of user-guide.md.
declare const reporter: import('@svta/cml-cmcd').CmcdReporter
declare const player: { getBufferLength(): number; getMeasuredThroughput(): number }
declare const decoratedRequest: import('@svta/cml-utils').HttpRequest
declare const request: import('@svta/cml-utils').HttpRequest & {
	customData: Record<symbol, unknown>
}
declare const response: import('@svta/cml-utils').HttpResponse
declare function axios(config: {
	url: string
	method?: string
	headers?: Record<string, string>
	data?: unknown
}): Promise<{ status: number }>
declare function sampleIntervals(
	data: import('@svta/cml-cmcd').Cmcd,
): import('@svta/cml-cmcd').Cmcd | null
type SegmentInfo = {
	bitrate: number
	duration: number
	type: import('@svta/cml-cmcd').CmcdObjectType
}
