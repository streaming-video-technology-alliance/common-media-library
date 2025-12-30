import type { DataInformationBox } from '../boxes/DataInformationBox.ts'
import type { GroupsListBox } from '../boxes/GroupsListBox.ts'
import type { HandlerReferenceBox } from '../boxes/HandlerReferenceBox.ts'
import type { ItemInfoBox } from '../boxes/ItemInfoBox.ts'
import type { ItemLocationBox } from '../boxes/ItemLocationBox.ts'
import type { ItemProtectionBox } from '../boxes/ItemProtectionBox.ts'
import type { ItemReferenceBox } from '../boxes/ItemReferenceBox.ts'
import type { MetaBox } from '../boxes/MetaBox.ts'
import type { PrimaryItemBox } from '../boxes/PrimaryItemBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
/**
 * Parse a MetaBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed MetaBox
 *
 * @public
 */
export function readMeta(view: IsoBoxReadView): MetaBox {
	return {
		type: 'meta',
		...view.readFullBox(),
		boxes: view.readBoxes<HandlerReferenceBox | PrimaryItemBox | DataInformationBox | ItemLocationBox | ItemProtectionBox | ItemInfoBox | ItemReferenceBox | GroupsListBox>(),
	}
}
