import { afterEach, vi } from 'vitest'

// node:test restored the fake timers after every test. Vitest keeps them until a test restores them.
afterEach(() => {
	vi.useRealTimers()
})
