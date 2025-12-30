import type { meco } from './boxes/AdditionalMetadataContainerBox.ts'
// import type { enca } from './boxes/AudioSampleEntryBox.ts'
import type { dinf } from './boxes/DataInformationBox.ts'
import type { edts } from './boxes/EditBox.ts'
import type { grpl } from './boxes/GroupsListBox.ts'
import type { mdia } from './boxes/MediaBox.ts'
import type { minf } from './boxes/MediaInformationBox.ts'
import type { meta } from './boxes/MetaBox.ts'
import type { moov } from './boxes/MovieBox.ts'
import type { mvex } from './boxes/MovieExtendsBox.ts'
import type { moof } from './boxes/MovieFragmentBox.ts'
import type { mfra } from './boxes/MovieFragmentRandomAccessBox.ts'
// import type { prsl } from './boxes/PreselectionGroupBox.ts'
import type { sinf } from './boxes/ProtectionSchemeInformationBox.ts'
import type { stbl } from './boxes/SampleTableBox.ts'
import type { schi } from './boxes/SchemeInformationBox.ts'
import type { strk } from './boxes/SubTrackBox.ts'
import type { trak } from './boxes/TrackBox.ts'
import type { traf } from './boxes/TrackFragmentBox.ts'
import type { tref } from './boxes/TrackReferenceBox.ts'
import type { udta } from './boxes/UserDataBox.ts'
// import type { encv } from './boxes/VisualSampleEntryBox.ts'
import type { vttc } from './boxes/WebVttCueBox.ts'

/**
 * Map of container box types to their allowed child box types
 *
 * @public
 */
export type IsoBoxContainerMap = {
	dinf: dinf
	edts: edts
	// enca: enca
	// encv: encv
	grpl: grpl
	mdia: mdia
	meco: meco
	meta: meta
	mfra: mfra
	minf: minf
	moof: moof
	moov: moov
	mvex: mvex
	// prsl: prsl
	schi: schi
	sinf: sinf
	stbl: stbl
	strk: strk
	traf: traf
	trak: trak
	tref: tref
	udta: udta
	vttc: vttc
}
