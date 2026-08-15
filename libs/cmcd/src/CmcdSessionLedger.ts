import type { Cmcd } from './Cmcd.ts'
import type { CmcdSessionState } from './CmcdSessionState.ts'

/** Reused so an idle `takeDirty()` pass returns without allocating. */
const NO_DIRTY_SESSIONS: readonly never[] = []

/**
 * Retained sessions keyed by `sid`, insertion-ordered oldest first, the
 * current session last. The ended-session count is capped by
 * `config.sessionRetention`. CTA-5004-B expects a `sid` to be unique
 * per playback session; a reused one replaces its retained namesake at
 * the newest position (see `startSession()`).
 */
export class CmcdSessionLedger<C> {
	private sessions = new Map<string, CmcdSessionState<C>>()
	private retention: number
	private seq = 0
	private dirty = new Set<CmcdSessionState<C>>()

	/**
	 * Monotonic counter bumped on every session change. A playback whose
	 * `epoch` trails it has a stale dedup baseline and resets on next use.
	 */
	epoch = 0
	current: CmcdSessionState<C>

	constructor(retention: number, initial: CmcdSessionState<C>) {
		this.retention = retention
		this.current = initial
		initial.seq = this.seq++
		this.sessions.set(initial.sid, initial)
	}

	/**
	 * Resolves the session a response belongs to: the provenance record's
	 * `sid` names one of this reporter's retained sessions, or the response
	 * is dropped. There is no other key — a record that was lost, or that
	 * names an evicted or never-seen `sid`, resolves nothing, and
	 * attributing it anywhere else would relabel it. The `sid` is read
	 * structurally, so a JSON-revived copy of a record attributes exactly,
	 * and a hand-built record naming a retained session is honored.
	 */
	resolve(provenance: unknown): CmcdSessionState<C> | undefined {
		if (provenance === null || typeof provenance !== 'object') {
			return undefined
		}

		const { sid } = provenance as { sid?: unknown; }

		return typeof sid === 'string' ? this.sessions.get(sid) : undefined
	}

	/**
	 * Map.set keeps an existing key's insertion position, so a reused
	 * sid must be deleted first: re-inserting at the newest position
	 * keeps oldest-first eviction from ever reaching the current
	 * session, and ages out genuinely older sessions ahead of it.
	 */
	rotate(next: CmcdSessionState<C>, pid: string, snapshot: Cmcd): void {
		this.current.snapshots.set(pid, snapshot)
		this.epoch++
		next.seq = this.seq++
		this.sessions.delete(next.sid)
		this.sessions.set(next.sid, next)
		this.current = next
	}

	/**
	 * An evicted session's unsent queues die with it, and its stale
	 * responses drop, because its sid no longer names a retained
	 * session. The current session was inserted last, so oldest-first
	 * eviction never reaches it, and `Infinity` retention never evicts.
	 */
	evict(): void {
		for (const [key, session] of this.sessions) {
			if (this.sessions.size <= this.retention + 1) {
				break
			}

			this.dirty.delete(session)
			this.sessions.delete(key)
		}
	}

	markDirty(session: CmcdSessionState<C>): void {
		if (this.sessions.get(session.sid) === session) {
			this.dirty.add(session)
		}
	}

	takeDirty(): readonly CmcdSessionState<C>[] {
		if (this.dirty.size === 0) {
			return NO_DIRTY_SESSIONS
		}

		const sessions = [...this.dirty].sort((a, b) => a.seq - b.seq)
		this.dirty.clear()
		return sessions
	}
}
