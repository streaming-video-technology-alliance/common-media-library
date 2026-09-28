/**
 * The `customData` a {@link CmcdReporter} method accepts, for a reporter typed
 * `C`.
 *
 * A reporter with the default `C` constrains nothing, so requests with any
 * `customData` are accepted exactly as before `C` existed. A reporter with a
 * concrete `C` requires the request to satisfy it. The reporter's transforms
 * read `customData` as `C` and would otherwise receive a value their type
 * does not describe.
 *
 * @typeParam C - The reporter's `customData` type.
 *
 * @public
 */
export type CmcdReporterCustomData<C> = Record<string, unknown> extends C ? any : C;
