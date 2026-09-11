/**
 * Listens to `visibilitychange` when a document exists. Returns the function that removes the listener,
 * or `undefined` outside a document. Does not call `onChange` for the initial state.
 */
export function observeVisibility(onChange: (hidden: boolean) => void): (() => void) | undefined {
	if (typeof document === 'undefined' || typeof document.addEventListener !== 'function') {
		return undefined
	}
	const listener = (): void => onChange(document.visibilityState === 'hidden')
	document.addEventListener('visibilitychange', listener)
	return () => document.removeEventListener('visibilitychange', listener)
}
