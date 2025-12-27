import type { DataInformationBox } from './DataInformationBox.ts'
import type { EditBox } from './EditBox.ts'
import type { ItemInfoBox } from './ItemInfoBox.ts'
import type { ItemProtectionBox } from './ItemProtectionBox.ts'
import type { ItemReferenceBox } from './ItemReferenceBox.ts'
import type { MediaBox } from './MediaBox.ts'
import type { MediaInformationBox } from './MediaInformationBox.ts'
import type { MetaBox } from './MetaBox.ts'
import type { MovieBox } from './MovieBox.ts'
import type { MovieExtendsBox } from './MovieExtendsBox.ts'
import type { MovieFragmentBox } from './MovieFragmentBox.ts'
import type { MovieFragmentRandomAccessBox } from './MovieFragmentRandomAccessBox.ts'
import type { ProtectionSchemeInformationBox } from './ProtectionSchemeInformationBox.ts'
import type { SampleTableBox } from './SampleTableBox.ts'
import type { SchemeInformationBox } from './SchemeInformationBox.ts'
import type { TrackBox } from './TrackBox.ts'
import type { TrackFragmentBox } from './TrackFragmentBox.ts'
import type { TrackReferenceBox } from './TrackReferenceBox.ts'
import type { UserDataBox } from './UserDataBox.ts'

/**
 * Container boxes that can contain other boxes
 *
 * @public
 */
export type IsoContainerBox =
	| DataInformationBox
	| EditBox
	| ItemInfoBox
	| ItemProtectionBox
	| ItemReferenceBox
	| MediaBox
	| MediaInformationBox
	| MetaBox
	| MovieBox
	| MovieExtendsBox
	| MovieFragmentBox
	| MovieFragmentRandomAccessBox
	| ProtectionSchemeInformationBox
	| SampleTableBox
	| SchemeInformationBox
	| TrackBox
	| TrackFragmentBox
	| TrackReferenceBox
	| UserDataBox;
