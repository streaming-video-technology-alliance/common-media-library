/**
 * IsoFieldTypeMap is a map of ISO BMFF field types to their corresponding JavaScript types.
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type IsoFieldTypeMap = {
	uint: number;
	int: number;
	template: number;
	string: string;
	data: Uint8Array;
	utf8: string;
	utf8string: string;
};
