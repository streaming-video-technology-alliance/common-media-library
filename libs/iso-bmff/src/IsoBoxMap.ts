import type { AdditionalMetadataContainerBox } from './boxes/AdditionalMetadataContainerBox.ts'
import type { AudioRenderingIndicationBox } from './boxes/AudioRenderingIndicationBox.ts'
import type { AudioSampleEntry } from './boxes/AudioSampleEntry.ts'
import type { ChunkLargeOffsetBox } from './boxes/ChunkLargeOffsetBox.ts'
import type { ChunkOffsetBox } from './boxes/ChunkOffsetBox.ts'
import type { CompactSampleSizeBox } from './boxes/CompactSampleSizeBox.ts'
import type { CompositionOffsetBox } from './boxes/CompositionOffsetBox.ts'
import type { DataEntryUrlBox } from './boxes/DataEntryUrlBox.ts'
import type { DataEntryUrnBox } from './boxes/DataEntryUrnBox.ts'
import type { DataInformationBox } from './boxes/DataInformationBox.ts'
import type { DataReferenceBox } from './boxes/DataReferenceBox.ts'
import type { TimeToSampleBox } from './boxes/TimeToSampleBox.ts'
import type { EditBox } from './boxes/EditBox.ts'
import type { EditListBox } from './boxes/EditListBox.ts'
import type { EventMessageBox } from './boxes/EventMessageBox.ts'
import type { ExtendedLanguageBox } from './boxes/ExtendedLanguageBox.ts'
import type { FileTypeBox } from './boxes/FileTypeBox.ts'
import type { FreeSpaceBox } from './boxes/FreeSpaceBox.ts'
import type { GroupsListBox } from './boxes/GroupsListBox.ts'
import type { HandlerBox } from './boxes/HandlerBox.ts'
import type { IdentifiedMediaDataBox } from './boxes/IdentifiedMediaDataBox.ts'
import type { LabelBox } from './boxes/LabelBox.ts'
import type { MediaBox } from './boxes/MediaBox.ts'
import type { MediaDataBox } from './boxes/MediaDataBox.ts'
import type { MediaHeaderBox } from './boxes/MediaHeaderBox.ts'
import type { MediaInformationBox } from './boxes/MediaInformationBox.ts'
import type { MetaBox } from './boxes/MetaBox.ts'
import type { MovieBox } from './boxes/MovieBox.ts'
import type { MovieExtendsBox } from './boxes/MovieExtendsBox.ts'
import type { MovieExtendsHeaderBox } from './boxes/MovieExtendsHeaderBox.ts'
import type { MovieFragmentBox } from './boxes/MovieFragmentBox.ts'
import type { MovieFragmentHeaderBox } from './boxes/MovieFragmentHeaderBox.ts'
import type { MovieFragmentRandomAccessBox } from './boxes/MovieFragmentRandomAccessBox.ts'
import type { MovieFragmentRandomAccessOffsetBox } from './boxes/MovieFragmentRandomAccessOffsetBox.ts'
import type { MovieHeaderBox } from './boxes/MovieHeaderBox.ts'
import type { OriginalFormatBox } from './boxes/OriginalFormatBox.ts'
import type { PreselectionGroupBox } from './boxes/PreselectionGroupBox.ts'
import type { ProducerReferenceTimeBox } from './boxes/ProducerReferenceTimeBox.ts'
import type { ProtectionSchemeInfoBox } from './boxes/ProtectionSchemeInfoBox.ts'
import type { ProtectionSystemSpecificHeaderBox } from './boxes/ProtectionSystemSpecificHeaderBox.ts'
import type { SampleDependencyTypeBox } from './boxes/SampleDependencyTypeBox.ts'
import type { SampleDescriptionBox } from './boxes/SampleDescriptionBox.ts'
import type { SampleSizeBox } from './boxes/SampleSizeBox.ts'
import type { SampleTableBox } from './boxes/SampleTableBox.ts'
import type { SampleToChunkBox } from './boxes/SampleToChunkBox.ts'
import type { SchemeInformationBox } from './boxes/SchemeInformationBox.ts'
import type { SchemeTypeBox } from './boxes/SchemeTypeBox.ts'
import type { SegmentIndexBox } from './boxes/SegmentIndexBox.ts'
import type { SegmentTypeBox } from './boxes/SegmentTypeBox.ts'
import type { SoundMediaHeaderBox } from './boxes/SoundMediaHeaderBox.ts'
import type { SubSampleInformationBox } from './boxes/SubSampleInformationBox.ts'
import type { SubsegmentIndexBox } from './boxes/SubsegmentIndexBox.ts'
import type { SubtitleMediaHeaderBox } from './boxes/SubtitleMediaHeaderBox.ts'
import type { SubTrack } from './boxes/SubTrack.ts'
import type { SyncSampleBox } from './boxes/SyncSampleBox.ts'
import type { TrackBox } from './boxes/TrackBox.ts'
import type { TrackEncryptionBox } from './boxes/TrackEncryptionBox.ts'
import type { TrackExtendsBox } from './boxes/TrackExtendsBox.ts'
import type { TrackFragmentBaseMediaDecodeTimeBox } from './boxes/TrackFragmentBaseMediaDecodeTimeBox.ts'
import type { TrackFragmentBox } from './boxes/TrackFragmentBox.ts'
import type { TrackFragmentHeaderBox } from './boxes/TrackFragmentHeaderBox.ts'
import type { TrackFragmentRandomAccessBox } from './boxes/TrackFragmentRandomAccessBox.ts'
import type { TrackHeaderBox } from './boxes/TrackHeaderBox.ts'
import type { KindBox } from './boxes/KindBox.ts'
import type { TrackReferenceBox } from './boxes/TrackReferenceBox.ts'
import type { TrackRunBox } from './boxes/TrackRunBox.ts'
import type { UserDataBox } from './boxes/UserDataBox.ts'
import type { VideoMediaHeaderBox } from './boxes/VideoMediaHeaderBox.ts'
import type { VisualSampleEntry } from './boxes/VisualSampleEntry.ts'
import type { WebVttConfigurationBox } from './boxes/WebVttConfigurationBox.ts'
import type { WebVttCueBox } from './boxes/WebVttCueBox.ts'
import type { WebVttCueIdBox } from './boxes/WebVttCueIdBox.ts'
import type { WebVttCuePayloadBox } from './boxes/WebVttCuePayloadBox.ts'
import type { WebVttEmptySampleBox } from './boxes/WebVttEmptySampleBox.ts'
import type { WebVttSettingsBox } from './boxes/WebVttSettingsBox.ts'
import type { WebVttSourceLabelBox } from './boxes/WebVttSourceLabelBox.ts'
import type { IsoInt64 } from './IsoInt64.ts'

/**
 * Map of each box type that the package names to the type of that box.
 *
 * @public
 */
export type IsoBoxMap<V extends IsoInt64 = number> = {
	ardi: AudioRenderingIndicationBox
	avc1: VisualSampleEntry<'avc1'>
	avc2: VisualSampleEntry<'avc2'>
	avc3: VisualSampleEntry<'avc3'>
	avc4: VisualSampleEntry<'avc4'>
	co64: ChunkLargeOffsetBox
	ctts: CompositionOffsetBox
	dinf: DataInformationBox
	dref: DataReferenceBox
	edts: EditBox<V>
	elng: ExtendedLanguageBox
	elst: EditListBox<V>
	emsg: EventMessageBox<V>
	enca: AudioSampleEntry<'enca'>
	encv: VisualSampleEntry<'encv'>
	free: FreeSpaceBox<'free'>
	frma: OriginalFormatBox
	ftyp: FileTypeBox
	grpl: GroupsListBox<V>
	hdlr: HandlerBox
	hev1: VisualSampleEntry<'hev1'>
	hvc1: VisualSampleEntry<'hvc1'>
	iden: WebVttCueIdBox
	imda: IdentifiedMediaDataBox
	kind: KindBox
	labl: LabelBox
	mdat: MediaDataBox
	mdhd: MediaHeaderBox<V>
	mdia: MediaBox<V>
	meco: AdditionalMetadataContainerBox<V>
	mehd: MovieExtendsHeaderBox<V>
	meta: MetaBox<V>
	mfhd: MovieFragmentHeaderBox
	mfra: MovieFragmentRandomAccessBox<V>
	mfro: MovieFragmentRandomAccessOffsetBox
	minf: MediaInformationBox
	moof: MovieFragmentBox<V>
	moov: MovieBox<V>
	mp4a: AudioSampleEntry<'mp4a'>
	mvex: MovieExtendsBox<V>
	mvhd: MovieHeaderBox<V>
	payl: WebVttCuePayloadBox
	prft: ProducerReferenceTimeBox<V>
	prsl: PreselectionGroupBox
	pssh: ProtectionSystemSpecificHeaderBox
	schi: SchemeInformationBox
	schm: SchemeTypeBox
	sdtp: SampleDependencyTypeBox
	sidx: SegmentIndexBox<V>
	sinf: ProtectionSchemeInfoBox
	skip: FreeSpaceBox<'skip'>
	smhd: SoundMediaHeaderBox
	ssix: SubsegmentIndexBox
	stbl: SampleTableBox
	stco: ChunkOffsetBox
	sthd: SubtitleMediaHeaderBox
	strk: SubTrack<V>
	stsc: SampleToChunkBox
	stsd: SampleDescriptionBox
	stss: SyncSampleBox
	stsz: SampleSizeBox
	sttg: WebVttSettingsBox
	stts: TimeToSampleBox
	styp: SegmentTypeBox
	subs: SubSampleInformationBox
	stz2: CompactSampleSizeBox
	tenc: TrackEncryptionBox
	tfdt: TrackFragmentBaseMediaDecodeTimeBox<V>
	tfhd: TrackFragmentHeaderBox<V>
	tfra: TrackFragmentRandomAccessBox<V>
	tkhd: TrackHeaderBox<V>
	traf: TrackFragmentBox<V>
	trak: TrackBox<V>
	tref: TrackReferenceBox
	trex: TrackExtendsBox
	trun: TrackRunBox
	udta: UserDataBox<V>
	'url ': DataEntryUrlBox
	'urn ': DataEntryUrnBox
	vlab: WebVttSourceLabelBox
	vmhd: VideoMediaHeaderBox
	vttc: WebVttCueBox
	vttC: WebVttConfigurationBox
	vtte: WebVttEmptySampleBox
}
