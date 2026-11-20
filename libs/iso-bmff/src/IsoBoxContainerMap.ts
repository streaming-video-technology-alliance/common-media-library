import type { AdditionalMetadataContainerBox } from './boxes/AdditionalMetadataContainerBox.ts'
import type { DataInformationBox } from './boxes/DataInformationBox.ts'
import type { EditBox } from './boxes/EditBox.ts'
import type { GroupsListBox } from './boxes/GroupsListBox.ts'
import type { LoudnessBox } from './boxes/LoudnessBox.ts'
import type { MediaBox } from './boxes/MediaBox.ts'
import type { MediaInformationBox } from './boxes/MediaInformationBox.ts'
import type { MovieBox } from './boxes/MovieBox.ts'
import type { MovieExtendsBox } from './boxes/MovieExtendsBox.ts'
import type { MovieFragmentBox } from './boxes/MovieFragmentBox.ts'
import type { MovieFragmentRandomAccessBox } from './boxes/MovieFragmentRandomAccessBox.ts'
import type { ProtectionSchemeInfoBox } from './boxes/ProtectionSchemeInfoBox.ts'
import type { RestrictedSchemeInfoBox } from './boxes/RestrictedSchemeInfoBox.ts'
import type { SampleTableBox } from './boxes/SampleTableBox.ts'
import type { SchemeInformationBox } from './boxes/SchemeInformationBox.ts'
import type { SubTrack } from './boxes/SubTrack.ts'
import type { SubTrackDefinition } from './boxes/SubTrackDefinition.ts'
import type { TrackBox } from './boxes/TrackBox.ts'
import type { TrackFragmentBox } from './boxes/TrackFragmentBox.ts'
import type { TrackGroupBox } from './boxes/TrackGroupBox.ts'
import type { TrackReferenceBox } from './boxes/TrackReferenceBox.ts'
import type { UserDataBox } from './boxes/UserDataBox.ts'
import type { WebVttCueBox } from './boxes/WebVttCueBox.ts'
import type { IsoInt64 } from './IsoInt64.ts'

/**
 * Map of each container box type to the type of that container box.
 *
 * @public
 */
export type IsoBoxContainerMap<V extends IsoInt64 = number> = {
	dinf: DataInformationBox<V>
	edts: EditBox<V>
	grpl: GroupsListBox<V>
	ludt: LoudnessBox<V>
	mdia: MediaBox<V>
	meco: AdditionalMetadataContainerBox<V>
	mfra: MovieFragmentRandomAccessBox<V>
	minf: MediaInformationBox<V>
	moof: MovieFragmentBox<V>
	moov: MovieBox<V>
	mvex: MovieExtendsBox<V>
	rinf: RestrictedSchemeInfoBox<V>
	schi: SchemeInformationBox<V>
	sinf: ProtectionSchemeInfoBox<V>
	stbl: SampleTableBox<V>
	strd: SubTrackDefinition<V>
	strk: SubTrack<V>
	traf: TrackFragmentBox<V>
	trak: TrackBox<V>
	tref: TrackReferenceBox<V>
	trgr: TrackGroupBox<V>
	udta: UserDataBox<V>
	vttc: WebVttCueBox<V>
}
