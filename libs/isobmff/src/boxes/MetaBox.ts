import type { ContainerBox } from './ContainerBox.js';
import type { DataInformationBox } from './DataInformationBox.js';
import type { FullBox } from './FullBox.js';
import type { HandlerReferenceBox } from './HandlerReferenceBox.js';
import type { ItemInfoBox } from './ItemInfoBox.js';
import type { ItemLocationBox } from './ItemLocationBox.js';
import type { ItemProtectionBox } from './ItemProtectionBox.js';
import type { ItemReferenceBox } from './ItemReferenceBox.js';
import type { PrimaryItemBox } from './PrimaryItemBox.js';

/**
 * ISO/IEC 14496-12:202x - 8.11.1 Meta box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type MetaBox = FullBox & ContainerBox<HandlerReferenceBox | PrimaryItemBox | DataInformationBox | ItemLocationBox | ItemProtectionBox | ItemInfoBox | ItemReferenceBox> & {
	type: 'meta';
};
