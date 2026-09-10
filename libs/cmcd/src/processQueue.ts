import type { HttpRequest } from '@svta/cml-utils'
import { CMCD_MIME_TYPE } from './CMCD_MIME_TYPE.ts'
import { reportSessionError } from './reportSessionError.ts'
import type { SessionState } from './SessionState.ts'
import type { SidState } from './SidState.ts'
import type { TargetState } from './TargetState.ts'

const BACK_OFF_CAP = 60000
const ATTEMPTS_TO_CAP = 7

function settle(session: SessionState, sidState: SidState, target: TargetState, batch: string[], status: number): void {
	const config = session.config.eventTargets[target.index]
	target.sending = false
	if (status >= 200 && status < 400) {
		target.attempt = 0
		if (target.queue.length === 0) {
			target.drainRequested = false
		}
		processQueue(session, sidState, target, false)
		return
	}
	if (status === 410) {
		target.gone = true
		target.queue.length = 0
		target.drainRequested = false
		return
	}
	if (status === 429 || status >= 500 || status === 0) {
		target.queue.unshift(...batch)
		if (target.queue.length > config.maxQueueSize) {
			target.queue.splice(0, target.queue.length - config.maxQueueSize)
		}
		target.attempt += 1
		if (sidState.ended && target.attempt > ATTEMPTS_TO_CAP) {
			target.queue.length = 0
			target.drainRequested = false
			reportSessionError(session, new Error(`CmcdSession: send failed for target ${config.url} after the back-off cap, status ${status}`))
			return
		}
		const delay = Math.min(1000 * 2 ** (target.attempt - 1), BACK_OFF_CAP)
		target.retryTimer = setTimeout(() => {
			target.retryTimer = undefined
			processQueue(session, sidState, target, true)
		}, delay)
		return
	}
	target.attempt = 0
	processQueue(session, sidState, target, false)
}

/**
 * Sends the next batch of one event target when the queue is ready. `drain` asks for the whole queue and is remembered
 * until the queue is empty, so a drain requested during a send is not lost.
 */
export function processQueue(session: SessionState, sidState: SidState, target: TargetState, drain: boolean): void {
	const config = session.config.eventTargets[target.index]
	if (!config) {
		return
	}
	if (drain) {
		target.drainRequested = true
	}
	if (target.gone || target.queue.length === 0 || target.sending || target.retryTimer !== undefined) {
		return
	}
	if (target.queue.length < config.batchSize && !target.drainRequested) {
		return
	}
	const batch = target.drainRequested ? target.queue.splice(0) : target.queue.splice(0, config.batchSize)
	const request: HttpRequest = {
		url: config.url,
		method: 'POST',
		headers: { 'Content-Type': CMCD_MIME_TYPE, ...(config.headers ?? {}) },
		body: batch.join('\n'),
	}
	target.sending = true
	let response: Promise<{ status: number }>
	try {
		response = session.config.requester(request)
	}
	catch {
		response = Promise.resolve({ status: 0 })
	}
	response.then(
		result => settle(session, sidState, target, batch, result.status),
		() => settle(session, sidState, target, batch, 0),
	)
}
