import type { IsoBox } from './IsoBox.ts'
import type { IsoContainerBox } from './IsoContainerBox.ts'

/**
 * Utility type for all ISO BMFF boxes
 *
 * @public
 */
export type IsoBmffBox = IsoBox | IsoContainerBox;
