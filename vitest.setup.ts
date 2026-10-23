import { afterEach, vi } from 'vite-plus/test'

// node:test restored the fake timers after every test. Vitest keeps them until a test restores them.
afterEach(() => {
	vi.useRealTimers()
})
