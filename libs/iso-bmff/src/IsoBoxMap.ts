import type { AudioRenderingIndicationBox } from './boxes/AudioRenderingIndicationBox.ts'
import type { AudioSampleEntryBox } from './boxes/AudioSampleEntryBox.ts'
import type { ChunkLargeOffsetBox } from './boxes/ChunkLargeOffsetBox.ts'
import type { ChunkOffsetBox } from './boxes/ChunkOffsetBox.ts'
import type { CompactSampleSizeBox } from './boxes/CompactSampleSizeBox.ts'
import type { CompositionTimeToSampleBox } from './boxes/CompositionTimeToSampleBox.ts'
import type { DataEntryUrlBox } from './boxes/DataEntryUrlBox.ts'
import type { DataEntryUrnBox } from './boxes/DataEntryUrnBox.ts'
import type { DataInformationBox } from './boxes/DataInformationBox.ts'
import type { DataReferenceBox } from './boxes/DataReferenceBox.ts'
import type { DecodingTimeToSampleBox } from './boxes/DecodingTimeToSampleBox.ts'
import type { DegradationPriorityBox } from './boxes/DegradationPriorityBox.ts'
import type { EditBox } from './boxes/EditBox.ts'
import type { EditListBox } from './boxes/EditListBox.ts'
import type { EventMessageBox } from './boxes/EventMessageBox.ts'
import type { ExtendedLanguageBox } from './boxes/ExtendedLanguageBox.ts'
import type { FileTypeBox } from './boxes/FileTypeBox.ts'
import type { FreeSpaceBox } from './boxes/FreeSpaceBox.ts'
import type { GroupsListBox } from './boxes/GroupsListBox.ts'
import type { HandlerReferenceBox } from './boxes/HandlerReferenceBox.ts'
import type { HintMediaHeaderBox } from './boxes/HintMediaHeaderBox.ts'
import type { IdentifiedMediaDataBox } from './boxes/IdentifiedMediaDataBox.ts'
import type { IpmpInfoBox } from './boxes/IpmpInfoBox.ts'
import type { ItemInfoBox } from './boxes/ItemInfoBox.ts'
import type { ItemInfoEntry } from './boxes/ItemInfoEntry.ts'
import type { ItemLocationBox } from './boxes/ItemLocationBox.ts'
import type { ItemProtectionBox } from './boxes/ItemProtectionBox.ts'
import type { ItemReferenceBox } from './boxes/ItemReferenceBox.ts'
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
import type { NullMediaHeaderBox } from './boxes/NullMediaHeaderBox.ts'
import type { OriginalFormatBox } from './boxes/OriginalFormatBox.ts'
import type { PreselectionGroupBox } from './boxes/PreselectionGroupBox.ts'
import type { PrimaryItemBox } from './boxes/PrimaryItemBox.ts'
import type { ProducerReferenceTimeBox } from './boxes/ProducerReferenceTimeBox.ts'
import type { ProtectionSchemeInformationBox } from './boxes/ProtectionSchemeInformationBox.ts'
import type { ProtectionSystemSpecificHeaderBox } from './boxes/ProtectionSystemSpecificHeaderBox.ts'
import type { SampleAuxiliaryInformationOffsetsBox } from './boxes/SampleAuxiliaryInformationOffsetsBox.ts'
import type { SampleAuxiliaryInformationSizesBox } from './boxes/SampleAuxiliaryInformationSizesBox.ts'
import type { SampleDependencyTypeBox } from './boxes/SampleDependencyTypeBox.ts'
import type { SampleDescriptionBox } from './boxes/SampleDescriptionBox.ts'
import type { SampleEncryptionBox } from './boxes/SampleEncryptionBox.ts'
import type { SampleGroupDescriptionBox } from './boxes/SampleGroupDescriptionBox.ts'
import type { SampleSizeBox } from './boxes/SampleSizeBox.ts'
import type { SampleTableBox } from './boxes/SampleTableBox.ts'
import type { SampleToChunkBox } from './boxes/SampleToChunkBox.ts'
import type { SampleToGroupBox } from './boxes/SampleToGroupBox.ts'
import type { SchemeInformationBox } from './boxes/SchemeInformationBox.ts'
import type { SchemeTypeBox } from './boxes/SchemeTypeBox.ts'
import type { SegmentIndexBox } from './boxes/SegmentIndexBox.ts'
import type { SegmentTypeBox } from './boxes/SegmentTypeBox.ts'
import type { ShadowSyncSampleBox } from './boxes/ShadowSyncSampleBox.ts'
import type { SoundMediaHeaderBox } from './boxes/SoundMediaHeaderBox.ts'
import type { SubsampleInformationBox } from './boxes/SubsampleInformationBox.ts'
import type { SubsegmentIndexBox } from './boxes/SubsegmentIndexBox.ts'
import type { SubtitleMediaHeaderBox } from './boxes/SubtitleMediaHeaderBox.ts'
import type { SyncSampleBox } from './boxes/SyncSampleBox.ts'
import type { TrackBox } from './boxes/TrackBox.ts'
import type { TrackEncryptionBox } from './boxes/TrackEncryptionBox.ts'
import type { TrackExtendsBox } from './boxes/TrackExtendsBox.ts'
import type { TrackFragmentBaseMediaDecodeTimeBox } from './boxes/TrackFragmentBaseMediaDecodeTimeBox.ts'
import type { TrackFragmentBox } from './boxes/TrackFragmentBox.ts'
import type { TrackFragmentHeaderBox } from './boxes/TrackFragmentHeaderBox.ts'
import type { TrackFragmentRandomAccessBox } from './boxes/TrackFragmentRandomAccessBox.ts'
import type { TrackHeaderBox } from './boxes/TrackHeaderBox.ts'
import type { TrackKindBox } from './boxes/TrackKindBox.ts'
import type { TrackReferenceBox } from './boxes/TrackReferenceBox.ts'
import type { TrackRunBox } from './boxes/TrackRunBox.ts'
import type { UserDataBox } from './boxes/UserDataBox.ts'
import type { VideoMediaHeaderBox } from './boxes/VideoMediaHeaderBox.ts'
import type { VisualSampleEntryBox } from './boxes/VisualSampleEntryBox.ts'
import type { WebVttConfigurationBox } from './boxes/WebVttConfigurationBox.ts'
import type { WebVttCueIdBox } from './boxes/WebVttCueIdBox.ts'
import type { WebVttCuePayloadBox } from './boxes/WebVttCuePayloadBox.ts'
import type { WebVttEmptySampleBox } from './boxes/WebVttEmptySampleBox.ts'
import type { WebVttSettingsBox } from './boxes/WebVttSettingsBox.ts'
import type { WebVttSourceLabelBox } from './boxes/WebVttSourceLabelBox.ts'

/**
 * Comprehensive mapping from box type strings to their corresponding TypeScript interfaces
 *
 * @public
 */
export type IsoBoxMap = {
	ardi: AudioRenderingIndicationBox;
	avc1: VisualSampleEntryBox<'avc1'>;
	avc2: VisualSampleEntryBox<'avc2'>;
	avc3: VisualSampleEntryBox<'avc3'>;
	avc4: VisualSampleEntryBox<'avc4'>;
	co64: ChunkLargeOffsetBox;
	ctts: CompositionTimeToSampleBox;
	dinf: DataInformationBox;
	dref: DataReferenceBox;
	edts: EditBox;
	elng: ExtendedLanguageBox;
	elst: EditListBox;
	emsg: EventMessageBox;
	enca: AudioSampleEntryBox<'enca'>;
	encv: VisualSampleEntryBox<'encv'>;
	free: FreeSpaceBox<'free'>;
	frma: OriginalFormatBox;
	ftyp: FileTypeBox;
	grpl: GroupsListBox;
	hdlr: HandlerReferenceBox;
	hev1: VisualSampleEntryBox<'hev1'>;
	hmhd: HintMediaHeaderBox;
	hvc1: VisualSampleEntryBox<'hvc1'>;
	iden: WebVttCueIdBox;
	iinf: ItemInfoBox;
	iloc: ItemLocationBox;
	imda: IdentifiedMediaDataBox;
	imif: IpmpInfoBox;
	infe: ItemInfoEntry;
	ipro: ItemProtectionBox;
	iref: ItemReferenceBox;
	kind: TrackKindBox;
	labl: LabelBox;
	mdat: MediaDataBox;
	mdhd: MediaHeaderBox;
	mdia: MediaBox;
	mehd: MovieExtendsHeaderBox;
	meta: MetaBox;
	mfhd: MovieFragmentHeaderBox;
	mfra: MovieFragmentRandomAccessBox;
	mfro: MovieFragmentRandomAccessOffsetBox;
	minf: MediaInformationBox;
	moof: MovieFragmentBox;
	moov: MovieBox;
	mp4a: AudioSampleEntryBox<'mp4a'>;
	mvex: MovieExtendsBox;
	mvhd: MovieHeaderBox;
	nmhd: NullMediaHeaderBox;
	payl: WebVttCuePayloadBox;
	pitm: PrimaryItemBox;
	prft: ProducerReferenceTimeBox;
	prsl: PreselectionGroupBox;
	pssh: ProtectionSystemSpecificHeaderBox;
	saio: SampleAuxiliaryInformationOffsetsBox;
	saiz: SampleAuxiliaryInformationSizesBox;
	sbgp: SampleToGroupBox;
	schi: SchemeInformationBox;
	schm: SchemeTypeBox;
	sdtp: SampleDependencyTypeBox;
	senc: SampleEncryptionBox;
	sgpd: SampleGroupDescriptionBox;
	sidx: SegmentIndexBox;
	sinf: ProtectionSchemeInformationBox;
	skip: FreeSpaceBox<'skip'>;
	smhd: SoundMediaHeaderBox;
	ssix: SubsegmentIndexBox;
	stbl: SampleTableBox;
	stco: ChunkOffsetBox;
	stdp: DegradationPriorityBox;
	sthd: SubtitleMediaHeaderBox;
	stsc: SampleToChunkBox;
	stsd: SampleDescriptionBox;
	stsh: ShadowSyncSampleBox;
	stss: SyncSampleBox;
	stsz: SampleSizeBox;
	sttg: WebVttSettingsBox;
	stts: DecodingTimeToSampleBox;
	styp: SegmentTypeBox;
	subs: SubsampleInformationBox;
	stz2: CompactSampleSizeBox;
	tenc: TrackEncryptionBox;
	tfdt: TrackFragmentBaseMediaDecodeTimeBox;
	tfhd: TrackFragmentHeaderBox;
	tfra: TrackFragmentRandomAccessBox;
	tkhd: TrackHeaderBox;
	traf: TrackFragmentBox;
	trak: TrackBox;
	tref: TrackReferenceBox;
	trex: TrackExtendsBox;
	trun: TrackRunBox;
	udta: UserDataBox;
	'url ': DataEntryUrlBox;
	'urn ': DataEntryUrnBox;
	vlab: WebVttSourceLabelBox;
	vmhd: VideoMediaHeaderBox;
	vttC: WebVttConfigurationBox;
	vtte: WebVttEmptySampleBox;
};
