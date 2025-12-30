import { isContainer, type ParsedBox } from '@svta/cml-iso-bmff'

export function* boxIterator(boxes: ParsedBox[]): Generator<ParsedBox> {
	for (const box of boxes) {
		yield box

		if (isContainer(box)) {
			yield* boxIterator(box.boxes as ParsedBox[])
		}
	}
}
