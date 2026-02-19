import type { IsoBoxFields } from './IsoBoxFields.ts'

/**
 * IsoFieldTypeMap is a map of ISO BMFF field types to their corresponding JavaScript types.
 *
 * @public
 */
export type IsoFieldTypeMap = {
	[IsoBoxFields.UINT]: number;
	[IsoBoxFields.INT]: number;
	[IsoBoxFields.TEMPLATE]: number;
	[IsoBoxFields.STRING]: string;
	[IsoBoxFields.DATA]: Uint8Array;
	[IsoBoxFields.UTF8]: string;
};
