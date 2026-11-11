import type { AdditionalMetadataContainerBox } from './boxes/AdditionalMetadataContainerBox.ts'
import type { DataInformationBox } from './boxes/DataInformationBox.ts'
import type { EditBox } from './boxes/EditBox.ts'
import type { GroupsListBox } from './boxes/GroupsListBox.ts'
import type { MediaBox } from './boxes/MediaBox.ts'
import type { MediaInformationBox } from './boxes/MediaInformationBox.ts'
import type { MovieBox } from './boxes/MovieBox.ts'
import type { MovieExtendsBox } from './boxes/MovieExtendsBox.ts'
import type { MovieFragmentBox } from './boxes/MovieFragmentBox.ts'
import type { MovieFragmentRandomAccessBox } from './boxes/MovieFragmentRandomAccessBox.ts'
import type { ProtectionSchemeInformationBox } from './boxes/ProtectionSchemeInformationBox.ts'
import type { SampleTableBox } from './boxes/SampleTableBox.ts'
import type { SchemeInformationBox } from './boxes/SchemeInformationBox.ts'
import type { SubTrackBox } from './boxes/SubTrackBox.ts'
import type { TrackBox } from './boxes/TrackBox.ts'
import type { TrackFragmentBox } from './boxes/TrackFragmentBox.ts'
import type { TrackReferenceBox } from './boxes/TrackReferenceBox.ts'
import type { UserDataBox } from './boxes/UserDataBox.ts'
import type { WebVttCueBox } from './boxes/WebVttCueBox.ts'
import type { IsoInt64 } from './IsoInt64.ts'

/**
 * Map of container box types to their allowed child box types
 *
 * @public
 */
export type IsoBoxContainerMap<V extends IsoInt64 = number> = {
	dinf: DataInformationBox
	edts: EditBox<V>
	grpl: GroupsListBox
	mdia: MediaBox<V>
	meco: AdditionalMetadataContainerBox
	mfra: MovieFragmentRandomAccessBox<V>
	minf: MediaInformationBox
	moof: MovieFragmentBox<V>
	moov: MovieBox<V>
	mvex: MovieExtendsBox<V>
	schi: SchemeInformationBox
	sinf: ProtectionSchemeInformationBox
	stbl: SampleTableBox
	strk: SubTrackBox
	traf: TrackFragmentBox<V>
	trak: TrackBox<V>
	tref: TrackReferenceBox
	udta: UserDataBox
	vttc: WebVttCueBox
}
