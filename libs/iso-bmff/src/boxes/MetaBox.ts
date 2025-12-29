import type { ContainerBox } from './ContainerBox.ts'
import type { DataInformationBox } from './DataInformationBox.ts'
import type { FullBox } from './FullBox.ts'
import type { GroupsListBox } from './GroupsListBox.ts'
import type { HandlerReferenceBox } from './HandlerReferenceBox.ts'
import type { ItemInfoBox } from './ItemInfoBox.ts'
import type { ItemLocationBox } from './ItemLocationBox.ts'
import type { ItemProtectionBox } from './ItemProtectionBox.ts'
import type { ItemReferenceBox } from './ItemReferenceBox.ts'
import type { PrimaryItemBox } from './PrimaryItemBox.ts'

/**
 * ISO/IEC 14496-12:202x - 8.11.1 Meta box
 *
 * @public
 */
export type MetaBox = FullBox & ContainerBox<HandlerReferenceBox | PrimaryItemBox | DataInformationBox | ItemLocationBox | ItemProtectionBox | ItemInfoBox | ItemReferenceBox | GroupsListBox> & {
	type: 'meta';
};

/**
 * @public
 */
export type meta = MetaBox;
