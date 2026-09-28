import type { CmcdRecordedReport } from './CmcdRecordedReport.ts'
import type { CmcdTransportAdapter } from './CmcdTransportAdapter.ts'

/**
 * Options for `CmcdReportRecorder.attach()`.
 *
 * @public
 */
export type CmcdReportRecorderOptions = {

	/**
	 * URLs whose POST requests the recorder intercepts and answers with a
	 * synthetic 204 response instead of sending them to the network. A
	 * request matches if its URL starts with any entry.
	 *
	 * Use this option to verify CMCD event-mode reports without real
	 * network calls to placeholder endpoints.
	 */
	eventTargetUrls?: readonly string[];

	/**
	 * Override the default transport adapters. Defaults to
	 * `[createXhrTransport(), createFetchTransport()]`, which patches
	 * `XMLHttpRequest` and `fetch` on the current realm.
	 *
	 * If the player under test uses a non-standard transport, for example
	 * a custom HTTP client, supply this option.
	 */
	transports?: readonly CmcdTransportAdapter[];

	/**
	 * Default timeout (in milliseconds) applied to every `waitFor*`
	 * call on this recorder. Each call can still pass an explicit
	 * timeout to override this default.
	 *
	 * @defaultValue `15000`
	 */
	waitTimeout?: number;

	/**
	 * Called once for each captured CMCD report, immediately after it
	 * is appended to the buffer and before any pending `waitFor*`
	 * promises resolve. Use for live UI inspection in test harness
	 * pages. `detach()` clears the callback. To resume notification,
	 * pass a new callback to a later `attach()`.
	 *
	 * The callback receives the same {@link CmcdRecordedReport}
	 * type that `getReports()` returns. If you only need a subset,
	 * filter by `report.type` or `report.reportingMode` inside the
	 * callback.
	 *
	 * @example
	 * {@includeCode ../test/CmcdReportRecorder.test.ts#example-on-report}
	 */
	onReport?: (report: CmcdRecordedReport) => void;
}
