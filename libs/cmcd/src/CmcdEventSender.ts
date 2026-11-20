import type { DeepReadonly } from '@svta/cml-utils'
import type { Cmcd } from './Cmcd.ts'
import type { CmcdEventSendResult } from './CmcdEventSendResult.ts'

/* oxlint-disable typescript/no-invalid-void-type */

/**
 * Sends the event reports of one batch for an event target of a CMCD session.
 *
 * The session calls the function with the reports of a batch, oldest report first.
 * Each report is the data of one event. The session has written `e`, `sid`, `sn`, `ts`, and `v`.
 * A token value is an `SfToken`, and an inner list is an array.
 * `encodeCmcd(report, { reportingMode: CmcdReportingMode.EVENT })` encodes a report.
 *
 * The promise takes the place of the HTTP response.
 * A promise that resolves means that the batch is delivered.
 * A result with `gone: true` stops the target, as a 410 response does.
 * A promise that rejects, or a function that throws, sends the batch again after a wait, as a 5xx response does.
 * The function must not change a report. The `DeepReadonly` type rejects a change at any depth.
 *
 * @param reports - The reports of the batch, oldest first.
 * @returns A promise of the result, or a promise of nothing.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/createCmcdSession.delivery.test.ts#example-send}
 */
export type CmcdEventSender = (
	reports: readonly DeepReadonly<Cmcd & Required<Pick<Cmcd, 'e' | 'sid' | 'sn' | 'ts' | 'v'>>>[],
) => Promise<CmcdEventSendResult | void>
