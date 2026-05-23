import type { CmcdRecordedReport } from './CmcdRecordedReport.ts'
import type { CmcdTransportAdapter } from './CmcdTransportAdapter.ts'

/**
 * Options for `CmcdReportRecorder.attach()`.
 *
 * @public
 */
export type CmcdReportRecorderOptions = {

	/**
	 * URLs whose POST requests are intercepted and stubbed with a
	 * synthetic 204 response, instead of being passed through to the
	 * network. A request matches if its URL starts with any entry.
	 *
	 * Use this to verify CMCD event-mode reports without making real
	 * network calls to placeholder endpoints.
	 */
	eventTargetUrls?: readonly string[];

	/**
	 * Override the default set of transport adapters. Defaults to
	 * `[createXhrTransport(), createFetchTransport()]`, which patches
	 * `XMLHttpRequest` and `fetch` on the current realm.
	 *
	 * Supply this when the player under test uses a non-standard
	 * transport (e.g. a custom HTTP client).
	 */
	transports?: readonly CmcdTransportAdapter[];

	/**
	 * Called once for each captured CMCD report, immediately after it
	 * is appended to the buffer and before any pending
	 * `waitForReports` promises resolve. Use for live UI inspection
	 * in test harness pages. Cleared automatically on `detach()`;
	 * pass a fresh callback to a subsequent `attach()` to resume
	 * notification.
	 *
	 * The callback receives the same {@link CmcdRecordedReport}
	 * shape that `getReports()` returns. Filter by `report.type` or
	 * `report.reportingMode` inside the callback if you only care
	 * about a subset.
	 *
	 * @example
	 * {@includeCode ../test/CmcdReportRecorder.test.ts#example-on-report}
	 */
	onReport?: (report: CmcdRecordedReport) => void;
}
