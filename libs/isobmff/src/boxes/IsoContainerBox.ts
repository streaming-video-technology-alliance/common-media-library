import type { DataInformationBox } from './DataInformationBox.js';
import type { EditBox } from './EditBox.js';
import type { ItemInfoBox } from './ItemInfoBox.js';
import type { ItemProtectionBox } from './ItemProtectionBox.js';
import type { ItemReferenceBox } from './ItemReferenceBox.js';
import type { MediaBox } from './MediaBox.js';
import type { MediaInformationBox } from './MediaInformationBox.js';
import type { MetaBox } from './MetaBox.js';
import type { MovieBox } from './MovieBox.js';
import type { MovieExtendsBox } from './MovieExtendsBox.js';
import type { MovieFragmentBox } from './MovieFragmentBox.js';
import type { MovieFragmentRandomAccessBox } from './MovieFragmentRandomAccessBox.js';
import type { ProtectionSchemeInformationBox } from './ProtectionSchemeInformationBox.js';
import type { SampleTableBox } from './SampleTableBox.js';
import type { SchemeInformationBox } from './SchemeInformationBox.js';
import type { TrackBox } from './TrackBox.js';
import type { TrackFragmentBox } from './TrackFragmentBox.js';
import type { TrackReferenceBox } from './TrackReferenceBox.js';
import type { UserDataBox } from './UserDataBox.js';

/**
 * Container boxes that can contain other boxes
 *
 * @group ISOBMFF
 *
 * @beta
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
