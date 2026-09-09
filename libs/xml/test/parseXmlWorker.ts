import type { XmlNode, XmlParseOptions } from '@svta/cml-xml'
import { Worker } from 'node:worker_threads'

const PARSE_XML_URL = import.meta.resolve('@svta/cml-xml')
const PARSE_TIMEOUT_MS = 2000

const WORKER_SOURCE = `
const { parentPort, workerData } = require('node:worker_threads')
import(workerData.url).then(({ parseXml }) => {
	const { inputs, prefixesOf, options } = workerData
	const count = inputs ? inputs.length : prefixesOf.length + 1
	for (let index = 0; index < count; index++) {
		parentPort.postMessage({ index })
		try {
			const result = parseXml(inputs ? inputs[index] : prefixesOf.slice(0, index), options)
			parentPort.postMessage({ index, result: inputs ? result : true })
		}
		catch (error) {
			parentPort.postMessage({ index, error: error instanceof Error ? error.message : String(error) })
		}
	}
})
`

export type ParseJob = { inputs: string[] } | { prefixesOf: string }

export type ParseOutcome<T> = { result: T } | { error: string }

type ParseMessage = {
	index: number;
	result?: unknown;
	error?: string;
}

/**
 * Parses each input, or each prefix of a document, in a worker thread so that a parser that
 * never returns fails the test instead of hanging the test runner. A prefix sweep reports only
 * whether each parse returned; the parsed trees stay in the worker.
 */
export function runParseWorker(job: { inputs: string[] }, options?: XmlParseOptions): Promise<ParseOutcome<XmlNode>[]>
export function runParseWorker(job: { prefixesOf: string }, options?: XmlParseOptions): Promise<ParseOutcome<true>[]>
export function runParseWorker(job: ParseJob, options?: XmlParseOptions): Promise<ParseOutcome<unknown>[]> {
	const count = 'inputs' in job ? job.inputs.length : job.prefixesOf.length + 1
	const inputAt = (index: number): string => 'inputs' in job ? job.inputs[index] : job.prefixesOf.slice(0, index)

	if (count === 0) {
		return Promise.resolve([])
	}

	return new Promise((done, fail) => {
		const worker = new Worker(WORKER_SOURCE, { eval: true, execArgv: [], workerData: { url: PARSE_XML_URL, options, ...job } })
		const outcomes: ParseOutcome<unknown>[] = []
		let current = 0
		let timer: ReturnType<typeof setTimeout>

		const settle = (callback: () => void) => {
			clearTimeout(timer)
			void worker.terminate()
			callback()
		}

		const watch = () => {
			clearTimeout(timer)
			timer = setTimeout(() => {
				settle(() => fail(new Error(`parseXml did not return within ${PARSE_TIMEOUT_MS}ms for ${JSON.stringify(inputAt(current))}`)))
			}, PARSE_TIMEOUT_MS)
		}

		worker.on('message', (message: ParseMessage) => {
			current = message.index
			if (message.error !== undefined) {
				outcomes.push({ error: message.error })
			}
			else if (message.result !== undefined) {
				outcomes.push({ result: message.result })
			}

			if (outcomes.length === count) {
				settle(() => done(outcomes))
			}
			else {
				watch()
			}
		})
		worker.on('error', (error) => settle(() => fail(error)))
		watch()
	})
}

/**
 * Parses a single input in a worker thread, rethrowing any parse error.
 */
export async function parseXmlGuarded(input: string, options?: XmlParseOptions): Promise<XmlNode> {
	const [outcome] = await runParseWorker({ inputs: [input] }, options)
	if ('error' in outcome) {
		throw new Error(outcome.error)
	}
	return outcome.result
}
