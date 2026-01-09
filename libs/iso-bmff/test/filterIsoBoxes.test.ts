import { filterIsoBoxes, readIsoBoxes, type ParsedIsoBox } from '@svta/cml-iso-bmff'
import { readFile } from 'fs/promises'
import { assert, describe, it, readFtyp } from './util/box.ts'

describe('filterIsoBoxes', function () {
	// Helper function to create a simple box
	function createBox(type: string): ParsedIsoBox {
		return { type, size: 0 } as ParsedIsoBox
	}

	// Helper function to create a container box
	function createContainer(type: string, boxes: ParsedIsoBox[]): ParsedIsoBox {
		return { type, size: 0, boxes } as ParsedIsoBox
	}

	it('should provide an example', async function () {
		// #region example
		const isoFile = await readFile('test/fixtures/captions.mp4')
		const boxes = readIsoBoxes(new Uint8Array(isoFile), { readers: { ftyp: readFtyp } })
		const ftyp = filterIsoBoxes(boxes, box => box.type === 'ftyp')
		assert.ok(ftyp.length > 0)
		assert.strictEqual(ftyp[0].type, 'ftyp')
		assert.strictEqual(ftyp[0].majorBrand, 'isom')
		// #endregion example
	})

	it('should return empty array for empty boxes', function () {
		const boxes: ParsedIsoBox[] = []
		const result = filterIsoBoxes(boxes, box => box.type === 'ftyp')
		assert.strictEqual(result.length, 0)
	})

	it('should filter boxes at root level', function () {
		const box1 = createBox('ftyp')
		const box2 = createBox('mdat')
		const box3 = createBox('moov')
		const result = filterIsoBoxes([box1, box2, box3], box => box.type === 'mdat' || box.type === 'moov')
		assert.strictEqual(result.length, 2)
		assert.strictEqual(result[0].type, 'mdat')
		assert.strictEqual(result[1].type, 'moov')
	})

	it('should return all matching boxes', function () {
		const box1 = createBox('trak')
		const box2 = createBox('trak')
		const box3 = createBox('trak')
		const result = filterIsoBoxes([box1, box2, box3], box => box.type === 'trak')
		assert.strictEqual(result.length, 3)
		assert.strictEqual(result[0], box1)
		assert.strictEqual(result[1], box2)
		assert.strictEqual(result[2], box3)
	})

	it('should return empty array when no box matches', function () {
		const box1 = createBox('ftyp')
		const box2 = createBox('mdat')
		const result = filterIsoBoxes([box1, box2], box => box.type === 'moov')
		assert.strictEqual(result.length, 0)
	})

	it('should filter nested boxes', function () {
		const hdlr1 = createBox('hdlr')
		const hdlr2 = createBox('hdlr')
		const mdia1 = createContainer('mdia', [hdlr1])
		const mdia2 = createContainer('mdia', [hdlr2])
		const trak1 = createContainer('trak', [mdia1])
		const trak2 = createContainer('trak', [mdia2])
		const moov = createContainer('moov', [trak1, trak2])

		const result = filterIsoBoxes([moov], box => box.type === 'hdlr')
		assert.strictEqual(result.length, 2)
		assert.strictEqual(result[0].type, 'hdlr')
		assert.strictEqual(result[1].type, 'hdlr')
	})

	it('should filter boxes at multiple levels', function () {
		const child = createBox('trak')
		const container = createContainer('moov', [child])
		const rootTrak = createBox('trak')

		const result = filterIsoBoxes([rootTrak, container], box => box.type === 'trak')
		assert.strictEqual(result.length, 2)
	})

	it('should respect maxDepth config', function () {
		const deepBox = createBox('deep')
		const midContainer = createContainer('trak', [deepBox])
		const topContainer = createContainer('moov', [midContainer])

		// maxDepth: 1 should only find moov and trak
		const result1 = filterIsoBoxes([topContainer], () => true, { maxDepth: 1 })
		assert.strictEqual(result1.length, 2)
		assert.strictEqual(result1[0].type, 'moov')
		assert.strictEqual(result1[1].type, 'trak')

		// maxDepth: 2 should find all three
		const result2 = filterIsoBoxes([topContainer], () => true, { maxDepth: 2 })
		assert.strictEqual(result2.length, 3)
	})

	it('should respect depthFirst config', function () {
		const child1 = createBox('child1')
		const child2 = createBox('child2')
		const container1 = createContainer('meta', [child1])
		const container2 = createContainer('trak', [child2])

		// Depth-first order
		const depthFirstResult = filterIsoBoxes([container1, container2], () => true, { depthFirst: true })
		assert.strictEqual(depthFirstResult.length, 4)
		assert.strictEqual(depthFirstResult[0].type, 'meta')
		assert.strictEqual(depthFirstResult[1].type, 'child1')
		assert.strictEqual(depthFirstResult[2].type, 'trak')
		assert.strictEqual(depthFirstResult[3].type, 'child2')

		// Breadth-first order
		const breadthFirstResult = filterIsoBoxes([container1, container2], () => true, { depthFirst: false })
		assert.strictEqual(breadthFirstResult.length, 4)
		assert.strictEqual(breadthFirstResult[0].type, 'meta')
		assert.strictEqual(breadthFirstResult[1].type, 'trak')
		assert.strictEqual(breadthFirstResult[2].type, 'child1')
		assert.strictEqual(breadthFirstResult[3].type, 'child2')
	})

	it('should work with complex callback conditions', function () {
		const box1 = { type: 'trak', size: 100 } as ParsedIsoBox
		const box2 = { type: 'trak', size: 200 } as ParsedIsoBox
		const box3 = { type: 'trak', size: 300 } as ParsedIsoBox
		const box4 = { type: 'mdat', size: 400 } as ParsedIsoBox

		const result = filterIsoBoxes([box1, box2, box3, box4], box => box.type === 'trak' && box.size > 150)
		assert.strictEqual(result.length, 2)
		assert.strictEqual(result[0], box2)
		assert.strictEqual(result[1], box3)
	})

	it('should work with Iterable input', function () {
		const box1 = createBox('ftyp')
		const box2 = createBox('mdat')
		const box3 = createBox('mdat')
		const boxSet = new Set([box1, box2, box3])

		const result = filterIsoBoxes(boxSet, box => box.type === 'mdat')
		assert.strictEqual(result.length, 2)
	})

	it('should preserve box references', function () {
		const box1 = createBox('trak')
		const box2 = createBox('trak')

		const result = filterIsoBoxes([box1, box2], box => box.type === 'trak')
		assert.strictEqual(result[0], box1)
		assert.strictEqual(result[1], box2)
	})
})
