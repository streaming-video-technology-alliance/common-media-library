import type { IsoBox } from './IsoBox.js';
import type { IsoContainerBox } from './IsoContainerBox.js';

/**
 * Utility type for all ISO BMFF boxes
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type IsoBmffBox = IsoBox | IsoContainerBox;
