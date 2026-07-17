/**
 * An action queued on a {@link Queue}. The provided function is assumed to
 * trigger an operation on a `SourceBuffer` that causes the buffer to start
 * updating.
 *
 * @internal
 */
export type action = () => unknown
