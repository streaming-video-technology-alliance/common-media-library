/**
 * The `customData` a {@link CmcdReporter} method accepts, for a reporter typed
 * `C`.
 *
 * A reporter left on the default `C` constrains nothing, so requests carrying
 * any `customData` are accepted exactly as they were before `C` existed. A
 * reporter given a concrete `C` requires the request to satisfy it, because its
 * transforms read `customData` as `C` and would otherwise be handed a value
 * their type does not describe.
 *
 * @typeParam C - The reporter's `customData` type.
 *
 * @public
 */
export type CmcdReporterCustomData<C> = Record<string, unknown> extends C ? any : C;
