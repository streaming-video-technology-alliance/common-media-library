import type { BmffHashExclusion, BmffHashSubset } from './BmffHashExclusion.ts'
import { type BmffBox, readBoxes } from './readRootBoxes.ts'

// C2PA section 18.6.2: '/' nodes, where a node is a 4cc with an optional [integer] and the integer has no leading zero
const XPATH_PATTERN = /^(\/[^/[\]]{4}(\[[1-9]\d*\])?)+$/
const FULLBOX_HEADER_SIZE = 4 // version(1) + flags(3)
const UUID_USERTYPE_SIZE = 16
const FLAGS_SIZE = 3

/**
 * One node of an exclusion xpath.
 *
 * @internal
 */
export type XpathNode = {
	/** Four-character box type code */
	readonly type: string
	/** 1-based index among the boxes of the type in the container, or 0 for every box of the type */
	readonly index: number
}

/**
 * An exclusion with its xpath parsed into nodes.
 *
 * @internal
 */
export type CompiledExclusion = {
	readonly nodes: readonly XpathNode[]
	readonly exclusion: BmffHashExclusion
}

/**
 * A byte range of a root box, with offsets from the start of the box header. `end` is exclusive.
 *
 * @internal
 */
export type ByteRange = {
	readonly start: number
	readonly end: number
}

const NO_RANGES: readonly ByteRange[] = []

/**
 * Parses an exclusion xpath into its nodes.
 *
 * @param xpath - The `xpath` field of an exclusion
 * @returns The nodes, or `null` if the xpath does not follow the grammar of C2PA section 18.6.2
 *
 * @internal
 */
export function parseXpath(xpath: string): XpathNode[] | null {
	if (!XPATH_PATTERN.test(xpath)) return null
	return xpath
		.slice(1)
		.split('/')
		.map(node => {
			const bracket = node.indexOf('[')
			if (bracket < 0) return { type: node, index: 0 }
			return { type: node.slice(0, bracket), index: Number(node.slice(bracket + 1, -1)) }
		})
}

/**
 * Parses the xpath of each exclusion once, for use with {@link findExcludedRanges}.
 * An exclusion whose xpath does not follow the grammar matches no box.
 *
 * @param exclusions - Exclusion list from a `c2pa.hash.bmff.v3` assertion or a VSI map
 * @returns The exclusions with parsed xpaths
 *
 * @internal
 */
export function compileExclusions(exclusions: readonly BmffHashExclusion[]): CompiledExclusion[] {
	const compiled: CompiledExclusion[] = []
	for (const exclusion of exclusions) {
		const nodes = parseXpath(exclusion.xpath)
		if (nodes) compiled.push({ nodes, exclusion })
	}
	return compiled
}

function nodeMatches(node: XpathNode, box: BmffBox): boolean {
	return node.type === box.type && (node.index === 0 || node.index === box.index)
}

function bytesMatchAt(
	bytes: Uint8Array,
	offset: number,
	expected: Uint8Array | readonly number[],
): boolean {
	if (offset + expected.length > bytes.length) return false
	for (let i = 0; i < expected.length; i++) {
		if (bytes[offset + i] !== expected[i]) return false
	}
	return true
}

// A uuid box puts its 16-byte usertype after the box header (ISO/IEC 14496-12 section 4.2).
function payloadOffset(box: BmffBox): number {
	return box.headerSize + (box.type === 'uuid' ? UUID_USERTYPE_SIZE : 0)
}

function readUint24(bytes: Uint8Array | readonly number[], offset: number): number {
	return (bytes[offset] << 16) | (bytes[offset + 1] << 8) | bytes[offset + 2]
}

// C2PA section 18.6.2: the length, version, flags, and data constraints of an exclusion
function constraintsMatch(box: BmffBox, exclusion: BmffHashExclusion): boolean {
	const { length, version, flags, data } = exclusion
	if (length !== undefined && box.bytes.length !== length) return false
	if (version !== undefined || flags !== undefined) {
		// A FullBox puts the version and flags at the start of its payload.
		const at = payloadOffset(box)
		if (at + FULLBOX_HEADER_SIZE > box.bytes.length) return false
		if (version !== undefined && box.bytes[at] !== version) return false
		if (flags !== undefined) {
			if (flags.length !== FLAGS_SIZE) return false
			const boxFlags = readUint24(box.bytes, at + 1)
			const expected = readUint24(flags, 0)
			if (exclusion.exact === false ? (boxFlags & expected) !== expected : boxFlags !== expected)
				return false
		}
	}
	if (data) {
		for (const constraint of data) {
			if (!bytesMatchAt(box.bytes, constraint.offset, constraint.value)) return false
		}
	}
	return true
}

// Subset offsets count from the start of the box header. A length of 0 runs to the end of the box.
// Bytes beyond the end of the box are never hashed.
function appendSubset(
	ranges: ByteRange[],
	boxStart: number,
	boxLength: number,
	subset: readonly BmffHashSubset[],
): void {
	for (const { offset, length } of subset) {
		if (offset >= boxLength) continue
		const end = length === 0 ? boxLength : Math.min(offset + length, boxLength)
		ranges.push({ start: boxStart + offset, end: boxStart + end })
	}
}

function appendMatch(ranges: ByteRange[], box: BmffBox, exclusion: BmffHashExclusion): void {
	if (exclusion.subset) appendSubset(ranges, box.offset, box.bytes.length, exclusion.subset)
	else ranges.push({ start: box.offset, end: box.offset + box.bytes.length })
}

// Appends the ranges that `exclusions` exclude among the child boxes between `start` and `end` of `root`.
// `depth` is the xpath node that the children match.
function appendChildRanges(
	root: Uint8Array,
	start: number,
	end: number,
	depth: number,
	exclusions: readonly CompiledExclusion[],
	ranges: ByteRange[],
): void {
	for (const child of readBoxes(root, start, end)) {
		let nested: CompiledExclusion[] | undefined
		for (const compiled of exclusions) {
			if (!nodeMatches(compiled.nodes[depth], child)) continue
			if (compiled.nodes.length > depth + 1) {
				;(nested ??= []).push(compiled)
			} else if (constraintsMatch(child, compiled.exclusion)) {
				appendMatch(ranges, child, compiled.exclusion)
			}
		}
		if (nested)
			appendChildRanges(
				root,
				child.offset + payloadOffset(child),
				child.offset + child.bytes.length,
				depth + 1,
				nested,
				ranges,
			)
	}
}

function mergeRanges(ranges: ByteRange[]): readonly ByteRange[] {
	if (ranges.length < 2) return ranges
	ranges.sort((a, b) => a.start - b.start)
	const merged: ByteRange[] = [ranges[0]]
	for (let i = 1; i < ranges.length; i++) {
		const range = ranges[i]
		const last = merged[merged.length - 1]
		if (range.start > last.end) merged.push(range)
		else if (range.end > last.end) merged[merged.length - 1] = { start: last.start, end: range.end }
	}
	return merged
}

/**
 * Finds the byte ranges of a root box that the exclusions exclude from the content hash (C2PA section 18.6.2).
 *
 * An exclusion with a single-node xpath and no `subset` excludes the matching root box in its entirety.
 * Any other exclusion excludes ranges of the box: the `subset` ranges, or the bytes of a nested box.
 * The function reads the child boxes of a box only when an xpath descends into that box.
 *
 * @param box - A root box with its 1-based index among the root boxes of the same type
 * @param exclusions - The exclusions from {@link compileExclusions}
 * @returns `null` if the box is excluded in its entirety, otherwise the excluded ranges, merged and in order of offset
 *
 * @internal
 */
export function findExcludedRanges(
	box: BmffBox,
	exclusions: readonly CompiledExclusion[],
): readonly ByteRange[] | null {
	let ranges: ByteRange[] | undefined
	let nested: CompiledExclusion[] | undefined
	for (const compiled of exclusions) {
		if (!nodeMatches(compiled.nodes[0], box)) continue
		if (compiled.nodes.length > 1) {
			;(nested ??= []).push(compiled)
			continue
		}
		if (!constraintsMatch(box, compiled.exclusion)) continue
		if (!compiled.exclusion.subset) return null
		appendSubset((ranges ??= []), 0, box.bytes.length, compiled.exclusion.subset)
	}
	if (nested)
		appendChildRanges(box.bytes, payloadOffset(box), box.bytes.length, 1, nested, (ranges ??= []))
	return ranges ? mergeRanges(ranges) : NO_RANGES
}
