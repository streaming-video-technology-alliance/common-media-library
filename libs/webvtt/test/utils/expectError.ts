import type { WebVttParsingError } from '@svta/cml-webvtt'
import { WebVttParser } from '@svta/cml-webvtt'
import { equal } from 'node:assert'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { options } from './options.ts'

const PACKAGE_ROOT = path.resolve(import.meta.dirname, '..', '..')

export async function expectError(vttFile: string, error: string): Promise<void> {
	const vttText = await readFile(path.resolve(PACKAGE_ROOT, vttFile), 'utf-8')

	let parseError: WebVttParsingError | undefined
	const parser = new WebVttParser(options)
	parser.onparsingerror = (error: WebVttParsingError) => (parseError = error)
	parser.parse(vttText)
	parser.flush()

	equal(parseError?.name, error)
}
