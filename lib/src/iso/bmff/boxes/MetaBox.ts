import type { ContainerBox } from './ContainerBox.js';
import type { DataInformationBox } from './DataInformationBox.js';
import type { HandlerReferenceBox } from './HandlerReferenceBox.js';
import type { ItemInfoBox } from './ItemInfoBox.js';
import type { ItemLocationBox } from './ItemLocationBox.js';
import type { ItemProtectionBox } from './ItemProtectionBox.js';
import type { ItemReferenceBox } from './ItemReferenceBox.js';
import type { PrimaryItemBox } from './PrimaryItemBox.js';

/**
 * Meta Box - 'meta' - Container
 */
export type MetaBox = ContainerBox<HandlerReferenceBox | PrimaryItemBox | DataInformationBox | ItemLocationBox | ItemProtectionBox | ItemInfoBox | ItemReferenceBox> & {
	type: 'meta';
};
