import {
	createDefaultReaderConfig,
	findIsoBox,
	isIsoBoxType,
	readFtyp,
	readIsoBoxes,
	type ParsedIsoBox,
} from '@svta/cml-iso-bmff'
import { readFile } from 'fs/promises'
import { assert, describe, it } from './util/box.ts'

describe('findIsoBox', function () {
	// Helper function to create a simple box
	function createBox(type: string): ParsedIsoBox {
		return { type } as ParsedIsoBox
	}

	// Helper function to create a container box
	function createContainer(type: string, boxes: ParsedIsoBox[]): ParsedIsoBox {
		return { type, boxes } as ParsedIsoBox
	}

	it('should provide an example', async function () {
		// #region example
		const isoFile = await readFile(new URL('./fixtures/captions.mp4', import.meta.url))
		const boxes = readIsoBoxes(isoFile, {
			readers: {
				ftyp: readFtyp,
			},
		})

		const ftyp = findIsoBox(boxes, box => isIsoBoxType('ftyp', box))

		assert.ok(ftyp)
		assert.strictEqual(ftyp.type, 'ftyp')
		assert.strictEqual(ftyp.majorBrand, 'isom')
		// #endregion example
	})

	it('should return null for empty boxes', function () {
		const boxes: ParsedIsoBox[] = []
		const result = findIsoBox(boxes, box => box.type === 'ftyp')
		assert.strictEqual(result, null)
	})

	it('should find a box at root level', function () {
		const box1 = createBox('ftyp')
		const box2 = createBox('mdat')
		const box3 = createBox('moov')
		const result = findIsoBox([box1, box2, box3], box => box.type === 'mdat')
		assert.notStrictEqual(result, null)
		assert.strictEqual(result?.type, 'mdat')
	})

	it('should return the first matching box', function () {
		const box1 = createBox('trak')
		const box2 = createBox('trak')
		const box3 = createBox('trak')
		const result = findIsoBox([box1, box2, box3], box => box.type === 'trak')
		assert.strictEqual(result, box1)
	})

	it('should return null when no box matches', function () {
		const box1 = createBox('ftyp')
		const box2 = createBox('mdat')
		const result = findIsoBox([box1, box2], box => box.type === 'moov')
		assert.strictEqual(result, null)
	})

	it('should find a nested box', function () {
		const deepBox = createBox('hdlr')
		const midContainer = createContainer('mdia', [deepBox])
		const topContainer = createContainer('trak', [midContainer])
		const moov = createContainer('moov', [topContainer])

		const result = findIsoBox([moov], box => box.type === 'hdlr')
		assert.notStrictEqual(result, null)
		assert.strictEqual(result?.type, 'hdlr')
	})

	it('should find a deeply nested box', function () {
		const level4 = createBox('mdia')
		const level3 = createContainer('trak', [level4])
		const level2 = createContainer('moov', [level3])
		const level1 = createContainer('meta', [level2])

		const result = findIsoBox([level1], box => box.type === 'mdia')
		assert.notStrictEqual(result, null)
		assert.strictEqual(result?.type, 'mdia')
	})

	it('should respect maxDepth config', function () {
		const deepBox = createBox('mdia')
		const midContainer = createContainer('trak', [deepBox])
		const topContainer = createContainer('moov', [midContainer])

		// maxDepth: 1 should find moov and trak, but not deep
		const result = findIsoBox([topContainer], box => box.type === 'mdia', { maxDepth: 1 })
		assert.strictEqual(result, null)

		// maxDepth: 2 should find deep
		const result2 = findIsoBox([topContainer], box => box.type === 'mdia', { maxDepth: 2 })
		assert.notStrictEqual(result2, null)
		assert.strictEqual(result2?.type, 'mdia')
	})

	it('should respect depthFirst config', function () {
		const deep = createBox('mdia')
		const shallow = createBox('mdia')
		const boxes = [
			createContainer('meta', [createContainer('trak', [deep])]),
			createContainer('moov', [shallow]),
		]

		const depthFirstResult = findIsoBox(boxes, box => box.type === 'mdia', { depthFirst: true })
		assert.strictEqual(depthFirstResult, deep)

		const breadthFirstResult = findIsoBox(boxes, box => box.type === 'mdia', { depthFirst: false })
		assert.strictEqual(breadthFirstResult, shallow)
	})

	it('should work with complex callback conditions', function () {
		const box1: ParsedIsoBox = { boxType: 'trak', bytes: new Uint8Array(100) }
		const box2: ParsedIsoBox = { boxType: 'trak', bytes: new Uint8Array(200) }
		const box3: ParsedIsoBox = { boxType: 'trak', bytes: new Uint8Array(300) }

		const result = findIsoBox(
			[box1, box2, box3],
			box => !box.type && box.boxType === 'trak' && box.bytes.length > 150,
		)
		assert.strictEqual(result, box2)
	})

	it('should work with Iterable input', function () {
		const box1 = createBox('ftyp')
		const box2 = createBox('mdat')
		const boxSet = new Set([box1, box2])

		const result = findIsoBox(boxSet, box => box.type === 'mdat')
		assert.notStrictEqual(result, null)
		assert.strictEqual(result?.type, 'mdat')
	})

	it('should find the child boxes of stsd and dref', async function () {
		const isoFile = await readFile(new URL('./fixtures/hvc1_init.mp4', import.meta.url))
		const boxes = readIsoBoxes(isoFile, createDefaultReaderConfig())

		assert.strictEqual(findIsoBox(boxes, box => box.type === 'hvc1')?.type, 'hvc1')
		assert.ok(findIsoBox(boxes, box => !box.type && box.boxType === 'hvcC'))
		assert.strictEqual(findIsoBox(boxes, box => box.type === 'url ')?.type, 'url ')
	})
})
