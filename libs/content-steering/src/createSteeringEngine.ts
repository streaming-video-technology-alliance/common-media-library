import type { HttpRequest, HttpResponse } from '@svta/cml-utils'
import { buildSteeringUri } from './buildSteeringUri.ts'
import { DEFAULT_PATHWAY_PENALTY } from './DEFAULT_PATHWAY_PENALTY.ts'
import { DEFAULT_TTL } from './DEFAULT_TTL.ts'
import { parseRetryAfter } from './parseRetryAfter.ts'
import { parseSteeringManifest } from './parseSteeringManifest.ts'
import type { PathwayClone } from './PathwayClone.ts'
import { resolveClones } from './resolveClones.ts'
import { selectPathway } from './selectPathway.ts'
import type { SteeringEngine } from './SteeringEngine.ts'
import type { SteeringEngineConfig } from './SteeringEngineConfig.ts'
import type { SteeringError } from './SteeringError.ts'
import { STEERING_ERROR_TYPE_CALLBACK, STEERING_ERROR_TYPE_LOAD, STEERING_ERROR_TYPE_PARSE } from './SteeringErrorType.ts'
import type { SteeringManifest } from './SteeringManifest.ts'
import { STEERING_PROTOCOL_DASH, STEERING_PROTOCOL_HLS } from './SteeringProtocol.ts'
import { uniqueStrings } from './uniqueStrings.ts'

const MAX_DELAY = 2147483647

type SteeringRequestError = Exclude<SteeringError, { type: typeof STEERING_ERROR_TYPE_CALLBACK }>

type CallbackName = Extract<SteeringError, { type: typeof STEERING_ERROR_TYPE_CALLBACK }>['callback']

type Failure = {
	readonly name: CallbackName;
	readonly cause: unknown;
}

/**
 * Creates a content steering engine.
 *
 * The engine requests the Steering Manifest, schedules the next request,
 * and selects the pathway that the player must apply.
 *
 * A callback that throws inside `penalize()` or `update()`
 * throws to the caller, after the engine has finished the call. Other
 * callback exceptions go to `onError`. Without `onError`, the engine throws
 * them from a timer callback.
 *
 * @param config - The configuration of the engine.
 * @returns The engine.
 *
 * @throws TypeError when the configuration is not valid.
 *
 * @example
 * {@includeCode ../test/createSteeringEngine.test.ts#example}
 *
 * @see {@link https://datatracker.ietf.org/doc/html/draft-pantos-content-steering-05#section-7 | Steering Client Responsibilities}
 *
 * @beta
 */
export function createSteeringEngine(config: SteeringEngineConfig): SteeringEngine {
	checkConfig(config)

	const {
		protocol,
		penalty,
		queryBeforeStart,
		requester = fetchRequester,
		getThroughput,
		getReportedPathways,
		acceptClone,
		onPathwayChange,
		onManifest,
		onError,
	} = config
	const isDash = protocol === STEERING_PROTOCOL_DASH
	const prefix = isDash ? '_DASH_' : '_HLS_'
	const penalties = new Map<string, number>()

	let pathways: readonly string[] = uniqueStrings(config.pathways)
	let selected = config.pathway
	let configuredUri = config.uri
	let uri = configuredUri
	let ttl = DEFAULT_TTL
	let loaded = false
	let ended = false
	let running = false
	let sent = false
	let session = 0
	let fallbackPriority = true
	let priority: readonly string[] = selected === undefined ? [] : fallbackList()
	let manifestClones: readonly unknown[] = []
	let known: ReadonlySet<string> = new Set(pathways)
	let acceptedIds: ReadonlySet<string> = new Set()
	let trail: string[] = selected === undefined ? [] : [selected]
	let nextRequestAt: number | undefined
	let requestTimer: ReturnType<typeof setTimeout> | undefined
	let penaltyTimer: ReturnType<typeof setTimeout> | undefined
	let pending: Promise<void> | undefined
	let settle: (() => void) | undefined
	let failures: Failure[] = []

	function start(): Promise<void> {
		if (running) {
			return pending ?? Promise.resolve()
		}

		return run(false, begin)
	}

	function begin(): Promise<void> {
		running = true
		select()

		if (ended) {
			return Promise.resolve()
		}

		const delay = nextRequestAt === undefined ? 0 : nextRequestAt - Date.now()

		if (delay > 0) {
			scheduleRequest(delay)
			return Promise.resolve()
		}

		const promise = new Promise<void>(resolve => {
			settle = resolve
		})
		const done = () => {
			if (pending === promise) {
				release()
			}
		}

		pending = promise
		void load().then(done, (cause: unknown) => {
			done()
			throw cause
		})

		return promise
	}

	function stop(): void {
		running = false
		session++
		clearTimeout(requestTimer)
		clearTimeout(penaltyTimer)
		requestTimer = undefined
		penaltyTimer = undefined
		release()
	}

	function penalize(pathway: string | undefined = selected): void {
		if (pathway === undefined) {
			return
		}

		penalties.set(pathway, Date.now() + (penalty ?? (isDash ? ttl * 1000 : DEFAULT_PATHWAY_PENALTY)))
		run(true, select)
	}

	function update(changes: { readonly uri?: string; readonly pathways?: readonly string[]; readonly priority?: readonly string[] }): void {
		const { uri: nextUri, pathways: nextPathways, priority: nextPriority } = changes

		if (nextUri !== undefined) {
			checkUri('SteeringEngine.update', nextUri)
		}

		if (nextPathways !== undefined) {
			checkPathways('SteeringEngine.update', nextPathways)
		}

		if (nextPriority !== undefined && (!Array.isArray(nextPriority) || nextPriority.some(id => typeof id !== 'string'))) {
			throw new TypeError(`SteeringEngine.update: priority must be an array of strings. Received ${JSON.stringify(nextPriority)}.`)
		}

		run(true, () => {
			if (nextPathways !== undefined) {
				pathways = uniqueStrings(nextPathways)

				if (fallbackPriority && priority.length > 0) {
					priority = fallbackList()
				}

				setClones(manifestClones, current => acceptedIds.has(current.ID))
			}

			if (nextPriority !== undefined) {
				priority = uniqueStrings(nextPriority)
				fallbackPriority = false
			}

			if (nextUri !== undefined && nextUri !== configuredUri) {
				configuredUri = nextUri
				uri = nextUri

				if (ended) {
					ended = false
					scheduleRequest(0)
				}
			}

			select()
		})
	}

	function release(): void {
		settle?.()
		settle = undefined
		pending = undefined
	}

	function run<T>(caller: boolean, body: () => T): T {
		const outer = failures

		failures = []

		try {
			const result = body()

			raise(failures, caller)

			return result
		} finally {
			failures = outer
		}
	}

	function raise(list: readonly Failure[], caller: boolean): void {
		const thrown = caller ? list[0] : undefined

		for (const failure of list) {
			if (failure !== thrown) {
				report({ type: STEERING_ERROR_TYPE_CALLBACK, callback: failure.name, cause: failure.cause, message: `The ${failure.name} callback threw.` })
			}
		}

		if (thrown) {
			throw thrown.cause
		}
	}

	function invoke<A extends unknown[], R>(name: CallbackName, callback: ((...args: A) => R) | undefined, ...args: A): R | undefined {
		if (!callback) {
			return undefined
		}

		try {
			return callback(...args)
		} catch (cause) {
			failures.push({ name, cause })
			return undefined
		}
	}

	function load(): Promise<void> {
		const token = session
		const url = buildSteeringUri(uri, queryParams())

		sent = true
		trail = selected === undefined ? [] : [selected]

		return send({ url, method: 'GET', responseType: 'text' }).then(
			response => {
				if (token === session) {
					run(false, () => receive(url, response))
				}
			},
			(cause: unknown) => {
				if (token === session) {
					retry({ type: STEERING_ERROR_TYPE_LOAD, url, cause, message: `The Steering Manifest request to ${url} failed.` })
				}
			},
		)
	}

	function send(request: HttpRequest): Promise<HttpResponse> {
		try {
			return Promise.resolve(requester(request))
		} catch (cause) {
			return Promise.reject(cause)
		}
	}

	function receive(url: string, response: HttpResponse): void {
		const status = response.status ?? 200

		if (status >= 200 && status < 300) {
			const responseUrl = response.url || url
			const result = parseSteeringManifest(response.data, responseUrl)

			if ('manifest' in result) {
				apply(result.manifest, result.priority, result.clones, result.reloadUri, responseUrl)
			} else if (isDash && result.version) {
				end()
				report({ type: STEERING_ERROR_TYPE_PARSE, url, status, message: result.error })
				fallback()
			} else {
				retry({ type: STEERING_ERROR_TYPE_PARSE, url, status, cause: result.cause, message: result.error })
			}
			return
		}

		if (status === 410) {
			end()
			report({ type: STEERING_ERROR_TYPE_LOAD, url, status, message: `The steering server returned status 410 for ${url}. No request follows.` })

			if (!loaded) {
				fallback()
			}
			return
		}

		const retryAfter = status === 429 ? parseRetryAfter(getHeader(response.headers, 'retry-after'), Date.now()) : undefined

		if (retryAfter !== undefined) {
			if (isDash) {
				ttl = retryAfter / 1000
			}

			retry({ type: STEERING_ERROR_TYPE_LOAD, url, status, message: `The steering server returned status 429 for ${url}.` }, retryAfter)
			return
		}

		retry({ type: STEERING_ERROR_TYPE_LOAD, url, status, message: `The Steering Manifest request to ${url} failed with status ${status}.` })
	}

	function apply(manifest: SteeringManifest, list: readonly string[], clones: readonly unknown[], reloadUri: string | undefined, responseUrl: string): void {
		loaded = true
		ttl = manifest.TTL
		uri = reloadUri ?? uri
		priority = list
		fallbackPriority = false

		const valid = setClones(clones, acceptsClone)

		scheduleRequest(ttl * 1000)
		invoke('onManifest', onManifest, manifest, valid, { url: responseUrl, reloadUri: uri })
		select()
	}

	function setClones(clones: readonly unknown[], accept: (clone: PathwayClone) => boolean): PathwayClone[] {
		const valid = resolveClones(clones, pathways, accept)

		manifestClones = clones
		known = new Set([...pathways, ...valid.map(clone => clone.ID)])
		acceptedIds = new Set(valid.map(clone => clone.ID))

		return valid
	}

	function acceptsClone(clone: PathwayClone): boolean {
		if (!acceptClone) {
			return true
		}

		try {
			return acceptClone(clone) !== false
		} catch (cause) {
			failures.push({ name: 'acceptClone', cause })
			return false
		}
	}

	function fallbackList(): readonly string[] {
		return selected === undefined ? pathways : [selected, ...pathways.filter(pathway => pathway !== selected)]
	}

	function fallback(): void {
		priority = fallbackList()
		fallbackPriority = true
		setClones([], acceptsClone)
		select()
	}

	function select(): void {
		const now = Date.now()

		penalties.forEach((expiry, pathway) => {
			if (expiry <= now) {
				penalties.delete(pathway)
			}
		})

		const next = selectPathway(priority, known, penalties)

		if (next !== undefined && next !== selected) {
			selected = next

			if (!trail.includes(next)) {
				trail.push(next)
			}

			invoke('onPathwayChange', onPathwayChange, next)
		}

		schedulePenaltyCheck(now)
	}

	function schedulePenaltyCheck(now: number): void {
		clearTimeout(penaltyTimer)
		penaltyTimer = undefined

		if (!running || penalties.size === 0) {
			return
		}

		let expiry = Infinity

		penalties.forEach(end => {
			expiry = Math.min(expiry, end)
		})

		penaltyTimer = setTimeout(onPenaltyTimer, Math.min(Math.max(expiry - now, 0), MAX_DELAY))
	}

	function onPenaltyTimer(): void {
		penaltyTimer = undefined
		run(false, select)
	}

	function scheduleRequest(delay: number): void {
		nextRequestAt = Date.now() + delay
		clearTimeout(requestTimer)
		requestTimer = running ? setTimeout(onRequestTimer, Math.min(delay, MAX_DELAY)) : undefined
	}

	function onRequestTimer(): void {
		requestTimer = undefined

		const delay = (nextRequestAt ?? 0) - Date.now()

		if (delay > 0) {
			scheduleRequest(delay)
			return
		}

		run(false, () => {
			void load()
		})
	}

	function end(): void {
		ended = true
		nextRequestAt = undefined
		clearTimeout(requestTimer)
		requestTimer = undefined
	}

	function retry(error: Omit<SteeringRequestError, 'retryDelay'>, delay: number = ttl * 1000): void {
		scheduleRequest(delay)
		report({ ...error, retryDelay: delay })
	}

	function report(error: SteeringError): void {
		if (!onError) {
			if (error.type === STEERING_ERROR_TYPE_CALLBACK) {
				throwLater(error.cause)
			}
			return
		}

		try {
			onError(error)
		} catch (cause) {
			throwLater(cause)
		}
	}

	function queryParams(): Record<string, string> {
		const params: Record<string, string> = {}

		if (queryBeforeStart && !sent) {
			return params
		}

		const list = isDash ? reportedPathways() : selected === undefined ? [] : [selected]

		if (list.length === 0) {
			return params
		}

		params[`${prefix}pathway`] = `"${list.join(',')}"`

		const throughputs = list.map(throughputOf)

		if (throughputs.some(value => value !== '')) {
			params[`${prefix}throughput`] = throughputs.join(',')
		}

		return params
	}

	function reportedPathways(): readonly string[] {
		const reported = invoke('getReportedPathways', getReportedPathways)

		return Array.isArray(reported) ? uniqueStrings(reported) : trail
	}

	function throughputOf(pathway: string): string {
		const value = invoke('getThroughput', getThroughput, pathway)

		return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? String(Math.round(value)) : ''
	}

	return {
		get pathway(): string | undefined {
			return selected
		},
		get priority(): readonly string[] {
			const now = Date.now()
			const list = selected === undefined ? [] : [selected]

			for (const id of priority) {
				if (id !== selected && known.has(id) && !((penalties.get(id) ?? 0) > now)) {
					list.push(id)
				}
			}

			return list
		},
		start,
		stop,
		penalize,
		update,
	}
}

function checkConfig({ protocol, uri, pathways, pathway, penalty }: SteeringEngineConfig): void {
	if (protocol !== STEERING_PROTOCOL_HLS && protocol !== STEERING_PROTOCOL_DASH) {
		throw new TypeError(`createSteeringEngine: protocol must be 'hls' or 'dash'. Received ${JSON.stringify(protocol)}.`)
	}

	checkUri('createSteeringEngine', uri)
	checkPathways('createSteeringEngine', pathways)

	if (pathway !== undefined && !pathways.includes(pathway)) {
		throw new TypeError(`createSteeringEngine: pathway must be one of pathways. Received ${JSON.stringify(pathway)}.`)
	}

	if (penalty !== undefined && (typeof penalty !== 'number' || !Number.isFinite(penalty) || penalty < 0)) {
		throw new TypeError(`createSteeringEngine: penalty must be a finite number of milliseconds, 0 or more. Received ${JSON.stringify(penalty)}.`)
	}
}

function checkUri(caller: string, uri: unknown): void {
	if (typeof uri !== 'string' || !isAbsoluteUri(uri)) {
		throw new TypeError(`${caller}: uri must be an absolute URI. Received ${JSON.stringify(uri)}.`)
	}
}

function checkPathways(caller: string, pathways: unknown): void {
	if (!Array.isArray(pathways) || pathways.length === 0 || pathways.some(id => typeof id !== 'string')) {
		throw new TypeError(`${caller}: pathways must be a non-empty array of strings. Received ${JSON.stringify(pathways)}.`)
	}
}

function isAbsoluteUri(uri: string): boolean {
	try {
		new URL(uri)
		return true
	} catch {
		return false
	}
}

function getHeader(headers: Record<string, string> | undefined, name: string): string | undefined {
	if (!headers) {
		return undefined
	}

	for (const key in headers) {
		if (key.toLowerCase() === name) {
			return headers[key]
		}
	}

	return undefined
}

function throwLater(cause: unknown): void {
	setTimeout(() => {
		throw cause
	}, 0)
}

function fetchRequester(request: HttpRequest): Promise<HttpResponse> {
	const { url, method, headers, credentials, mode } = request

	return fetch(url, { method, headers, credentials, mode }).then(response => response.text().then(data => {
		const responseHeaders: Record<string, string> = {}

		response.headers.forEach((value, key) => {
			responseHeaders[key] = value
		})

		return { request, url: response.url, status: response.status, headers: responseHeaders, data }
	}))
}
