const TOKENS = /\$(RepresentationID|Number|SubNumber|Bandwidth|Time)?(?:%0([0-9]+)([diouxX]))?\$/g;

/**
 * Process a URI template used in `SegmentTemplate` nodes.
 *
 * @param uriTemplate - URI template to process.
 * @param representationId - Representation ID.
 * @param number - Number.
 * @param subNumber - Sub-number.
 * @param bandwidth - Bandwidth.
 * @param time - Time.
 *
 * @returns Processed URI template.
 *
 * @group DASH
 * @beta
 *
 * @example
 * {@includeCode ../../test/dash/processUriTemplate.test.ts#example}
 */
export function processUriTemplate(
	uriTemplate: string,
	representationId: string | null | undefined,
	number: number | null | undefined,
	subNumber: number | null | undefined,
	bandwidth: number | null | undefined,
	time: number | null | undefined,
) {
	const uri = uriTemplate.replace(TOKENS, (match, name, widthStr, format) => {
		let value: string | number | null | undefined;

		switch (name) {
			case undefined: // $$ case
				return '$';

			case 'RepresentationID':
				value = representationId;
				break;

			case 'Number':
				value = number;
				break;

			case 'SubNumber':
				value = subNumber;
				break;

			case 'Bandwidth':
				value = bandwidth;
				break;

			case 'Time':
				value = time ? Math.round(time) : time;
				break;

			default:
				value = null;
		}

		if (value == null) {
			return match;
		}

		let valueString: string;

		switch (format) {
			case undefined:  // Happens if there is no format specifier.
			case 'd':
			case 'i':
			case 'u':
				valueString = value.toString();
				break;

			case 'o':
				valueString = value.toString(8);
				break;

			case 'x':
				valueString = value.toString(16);
				break;

			case 'X':
				valueString = value.toString(16).toUpperCase();
				break;

			default:
				valueString = value.toString();
				break;
		}

		const width = parseInt(widthStr, 10) || 1;
		return valueString.padStart(width, '0');
	});

	return uri;
}
