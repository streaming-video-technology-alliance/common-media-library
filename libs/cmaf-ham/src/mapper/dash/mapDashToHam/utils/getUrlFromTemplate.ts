import type { Representation } from '../../../../types/mapper/dash/Representation.ts'
import type { SegmentTemplate } from '../../../../types/mapper/dash/SegmentTemplate.ts'

const TOKEN_PATTERN = /\$(.*?)\$/g
const NUMBER_FORMAT_TAG_PATTERN = /Number%0(\d+)d/

/**
 * @internal
 *
 * Create the url from a segment template.
 *
 * Searches for substrings with the format `$value$` and replaces it with the correct value.
 * - RepresentationID: id of the representation
 * - Number: id of the segment. `%0Xd` defines the number `X` of digits it needs to have
 *
 * @param representation - Representation of the template
 * @param segmentTemplate - Segment template
 * @param segmentId - Segment id
 * @returns url from the segment template
 */
export function getUrlFromTemplate(
	representation: Representation,
	segmentTemplate: SegmentTemplate,
	segmentId: number,
): string {
	return segmentTemplate.$.media.replace(TOKEN_PATTERN, (match: string) => {
		if (match.includes('RepresentationID')) {
			return representation.$.id
		}
		const width = NUMBER_FORMAT_TAG_PATTERN.exec(match)?.[1]
		if (width) {
			return segmentId.toString().padStart(Number(width), '0')
		}
		if (match.includes('Number')) {
			return segmentId.toString()
		}
		console.error(
			`Unknown property ${match} from the SegmentTemplate on representation ${representation.$.id}`,
		)
		return match
	})
}
