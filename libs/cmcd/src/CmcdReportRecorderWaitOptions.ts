/**
 * Options for the `waitFor*` methods on
 * {@link CmcdReportRecorder | CmcdReportRecorder}.
 *
 * @public
 */
export type CmcdReportRecorderWaitOptions = {
	/**
	 * Minimum number of matching reports the call should resolve with.
	 *
	 * @defaultValue `1`
	 */
	count?: number;

	/**
	 * Maximum time to wait (in milliseconds) before rejecting. Falls
	 * back to the recorder's `waitTimeout` attach option (15000 ms if
	 * unset).
	 */
	timeout?: number;
}
