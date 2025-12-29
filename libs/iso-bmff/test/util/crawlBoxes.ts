import { isContainer, type ParsedBox } from '@svta/cml-iso-bmff'

export function crawlBoxes(boxes: ParsedBox[], visitor: (box: ParsedBox) => boolean): boolean {
	for (const box of boxes) {
		const result = isContainer(box) ? crawlBoxes(box.boxes, visitor) : visitor(box)
		if (result === false) {
			return false
		}
	}

	return true
}
