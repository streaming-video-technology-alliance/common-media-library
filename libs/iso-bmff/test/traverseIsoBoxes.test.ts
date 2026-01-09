import { readIsoBoxes, traverseIsoBoxes, type ParsedIsoBox } from '@svta/cml-iso-bmff'
import { equal } from 'assert'
import { readFile } from 'fs/promises'
import { assert, describe, it } from './util/box.ts'

describe('traverseIsoBoxes', function () {
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
		const boxes = readIsoBoxes(new Uint8Array(isoFile))

		for (const box of traverseIsoBoxes(boxes)) {
			equal(box.type, 'ftyp')
			break
		}
		// #endregion example
	})

	it('should traverse empty boxes', function () {
		const boxes: ParsedIsoBox[] = []
		const result = Array.from(traverseIsoBoxes(boxes))
		assert.strictEqual(result.length, 0)
	})

	it('should traverse a single box', function () {
		const box = createBox('ftyp')
		const result = Array.from(traverseIsoBoxes([box]))
		assert.strictEqual(result.length, 1)
		assert.strictEqual(result[0].type, 'ftyp')
	})

	it('should traverse multiple boxes at root level', function () {
		const box1 = createBox('ftyp')
		const box2 = createBox('mdat')
		const box3 = createBox('moov')
		const result = Array.from(traverseIsoBoxes([box1, box2, box3]))
		assert.strictEqual(result.length, 3)
		assert.strictEqual(result[0].type, 'ftyp')
		assert.strictEqual(result[1].type, 'mdat')
		assert.strictEqual(result[2].type, 'moov')
	})

	it('should traverse nested boxes depth-first by default', function () {
		const child1 = createBox('child1')
		const child2 = createBox('child2')
		const container = createContainer('meta', [child1, child2])
		const root = createBox('root')
		const result = Array.from(traverseIsoBoxes([root, container]))

		// Depth-first: root -> container -> child1 -> child2
		assert.strictEqual(result.length, 4)
		assert.strictEqual(result[0].type, 'root')
		assert.strictEqual(result[1].type, 'meta')
		assert.strictEqual(result[2].type, 'child1')
		assert.strictEqual(result[3].type, 'child2')
	})

	it('should traverse nested boxes breadth-first when specified', function () {
		const child1 = createBox('child1')
		const child2 = createBox('child2')
		const container = createContainer('meta', [child1, child2])
		const root = createBox('root')
		const result = Array.from(traverseIsoBoxes([root, container], false))

		// Breadth-first: root -> container -> child1 -> child2
		// Note: In this simple case, the order is the same, but let's verify
		assert.strictEqual(result.length, 4)
		assert.strictEqual(result[0].type, 'root')
		assert.strictEqual(result[1].type, 'meta')
		assert.strictEqual(result[2].type, 'child1')
		assert.strictEqual(result[3].type, 'child2')
	})

	it('should traverse deeply nested boxes depth-first', function () {
		const deepChild = createBox('deep')
		const midContainer = createContainer('trak', [deepChild])
		const topContainer = createContainer('moov', [midContainer])
		const result = Array.from(traverseIsoBoxes([topContainer], true))

		// Depth-first: moov -> trak -> deep
		assert.strictEqual(result.length, 3)
		assert.strictEqual(result[0].type, 'moov')
		assert.strictEqual(result[1].type, 'trak')
		assert.strictEqual(result[2].type, 'deep')
	})

	it('should traverse deeply nested boxes breadth-first', function () {
		const deepChild1 = createBox('deep1')
		const deepChild2 = createBox('deep2')
		const midContainer1 = createContainer('trak', [deepChild1])
		const midContainer2 = createContainer('trak', [deepChild2])
		const topContainer = createContainer('moov', [midContainer1, midContainer2])
		const result = Array.from(traverseIsoBoxes([topContainer], false))

		// Breadth-first: moov -> trak -> trak -> deep1 -> deep2
		assert.strictEqual(result.length, 5)
		assert.strictEqual(result[0].type, 'moov')
		assert.strictEqual(result[1].type, 'trak')
		assert.strictEqual(result[2].type, 'trak')
		assert.strictEqual(result[3].type, 'deep1')
		assert.strictEqual(result[4].type, 'deep2')
	})

	it('should respect maxDepth parameter', function () {
		const deepChild = createBox('deep')
		const midContainer = createContainer('trak', [deepChild])
		const topContainer = createContainer('moov', [midContainer])
		const result = Array.from(traverseIsoBoxes([topContainer], true, 1))

		// Should only traverse to depth 1: moov -> trak (but not deep)
		assert.strictEqual(result.length, 2)
		assert.strictEqual(result[0].type, 'moov')
		assert.strictEqual(result[1].type, 'trak')
	})

	it('should respect maxDepth parameter with depth 0', function () {
		const child = createBox('child')
		const container = createContainer('meta', [child])
		const result = Array.from(traverseIsoBoxes([container], true, 0))

		// Should only return the root container, not its children
		assert.strictEqual(result.length, 1)
		assert.strictEqual(result[0].type, 'meta')
	})

	it('should handle multiple containers at same level', function () {
		const child1 = createBox('child1')
		const child2 = createBox('child2')
		const container1 = createContainer('meta', [child1])
		const container2 = createContainer('trak', [child2])
		const result = Array.from(traverseIsoBoxes([container1, container2], true))

		// Depth-first: meta -> child1 -> trak -> child2
		assert.strictEqual(result.length, 4)
		assert.strictEqual(result[0].type, 'meta')
		assert.strictEqual(result[1].type, 'child1')
		assert.strictEqual(result[2].type, 'trak')
		assert.strictEqual(result[3].type, 'child2')
	})

	it('should handle container with empty boxes array', function () {
		const emptyContainer = createContainer('meta', [])
		const result = Array.from(traverseIsoBoxes([emptyContainer]))
		assert.strictEqual(result.length, 1)
		assert.strictEqual(result[0].type, 'meta')
	})

	it('should handle mixed containers and non-containers', function () {
		const child = createBox('child')
		const container = createContainer('meta', [child])
		const nonContainer = createBox('ftyp')
		const result = Array.from(traverseIsoBoxes([nonContainer, container], true))

		assert.strictEqual(result.length, 3)
		assert.strictEqual(result[0].type, 'ftyp')
		assert.strictEqual(result[1].type, 'meta')
		assert.strictEqual(result[2].type, 'child')
	})

	it('should work with Iterable input (not just arrays)', function () {
		const box1 = createBox('ftyp')
		const box2 = createBox('mdat')
		const boxSet = new Set([box1, box2])
		const result = Array.from(traverseIsoBoxes(boxSet))
		assert.strictEqual(result.length, 2)
	})

	it('should handle complex nested structure with maxDepth', function () {
		const level3 = createBox('level3')
		const level2 = createContainer('trak', [level3])
		const level1 = createContainer('moov', [level2])
		const result = Array.from(traverseIsoBoxes([level1], true, 2))

		// Should traverse to depth 2: moov -> trak -> level3
		assert.strictEqual(result.length, 3)
		assert.strictEqual(result[0].type, 'moov')
		assert.strictEqual(result[1].type, 'trak')
		assert.strictEqual(result[2].type, 'level3')
	})

	it('should handle maxDepth with breadth-first traversal', function () {
		const deep1 = createBox('deep1')
		const deep2 = createBox('deep2')
		const mid1 = createContainer('trak', [deep1])
		const mid2 = createContainer('trak', [deep2])
		const top = createContainer('moov', [mid1, mid2])
		const result = Array.from(traverseIsoBoxes([top], false, 1))

		// Should only traverse to depth 1: moov -> trak -> trak (but not deep1, deep2)
		assert.strictEqual(result.length, 3)
		assert.strictEqual(result[0].type, 'moov')
		assert.strictEqual(result[1].type, 'trak')
		assert.strictEqual(result[2].type, 'trak')
	})
})

