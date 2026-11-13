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
 * @deprecated This type serves `transform` of `CmcdReporter`. A session has no transform. A {@link CmcdReportFilter} drops reports, and the data of each call changes them.
 * The {@link https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/cmcd/docs/migration-guide.md | migration guide} maps each member to the session API. Version 3.0.0 removes this type.
 *
 * @public
 */
export type CmcdReporterCustomData<C> = Record<string, unknown> extends C ? any : C
