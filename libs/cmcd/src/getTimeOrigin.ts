/** The epoch time the performance clock started, guarded for a runtime where `timeOrigin` is absent or zero. */
export function getTimeOrigin(): number {
	return performance.timeOrigin || performance.timing?.fetchStart || Date.now() - performance.now()
}
