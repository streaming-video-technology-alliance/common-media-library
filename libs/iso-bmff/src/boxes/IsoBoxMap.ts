import type { AudioRenderingIndicationBox } from './AudioRenderingIndicationBox.ts'
import type { AudioSampleEntryBox } from './AudioSampleEntryBox.ts'
import type { ChunkLargeOffsetBox } from './ChunkLargeOffsetBox.ts'
import type { ChunkOffsetBox } from './ChunkOffsetBox.ts'
import type { CompactSampleSizeBox } from './CompactSampleSizeBox.ts'
import type { CompositionTimeToSampleBox } from './CompositionTimeToSampleBox.ts'
import type { DataEntryUrlBox } from './DataEntryUrlBox.ts'
import type { DataEntryUrnBox } from './DataEntryUrnBox.ts'
import type { DataInformationBox } from './DataInformationBox.ts'
import type { DataReferenceBox } from './DataReferenceBox.ts'
import type { DecodingTimeToSampleBox } from './DecodingTimeToSampleBox.ts'
import type { DegradationPriorityBox } from './DegradationPriorityBox.ts'
import type { EditBox } from './EditBox.ts'
import type { EditListBox } from './EditListBox.ts'
import type { EventMessageBox } from './EventMessageBox.ts'
import type { ExtendedLanguageBox } from './ExtendedLanguageBox.ts'
import type { FileTypeBox } from './FileTypeBox.ts'
import type { FreeSpaceBox } from './FreeSpaceBox.ts'
import type { HandlerReferenceBox } from './HandlerReferenceBox.ts'
import type { HintMediaHeaderBox } from './HintMediaHeaderBox.ts'
import type { IdentifiedMediaDataBox } from './IdentifiedMediaDataBox.ts'
import type { IpmpInfoBox } from './IpmpInfoBox.ts'
import type { ItemInfoBox } from './ItemInfoBox.ts'
import type { ItemInfoEntry } from './ItemInfoEntry.ts'
import type { ItemLocationBox } from './ItemLocationBox.ts'
import type { ItemProtectionBox } from './ItemProtectionBox.ts'
import type { ItemReferenceBox } from './ItemReferenceBox.ts'
import type { LabelBox } from './LabelBox.ts'
import type { MediaBox } from './MediaBox.ts'
import type { MediaDataBox } from './MediaDataBox.ts'
import type { MediaHeaderBox } from './MediaHeaderBox.ts'
import type { MediaInformationBox } from './MediaInformationBox.ts'
import type { MetaBox } from './MetaBox.ts'
import type { MovieBox } from './MovieBox.ts'
import type { MovieExtendsBox } from './MovieExtendsBox.ts'
import type { MovieExtendsHeaderBox } from './MovieExtendsHeaderBox.ts'
import type { MovieFragmentBox } from './MovieFragmentBox.ts'
import type { MovieFragmentHeaderBox } from './MovieFragmentHeaderBox.ts'
import type { MovieFragmentRandomAccessBox } from './MovieFragmentRandomAccessBox.ts'
import type { MovieFragmentRandomAccessOffsetBox } from './MovieFragmentRandomAccessOffsetBox.ts'
import type { MovieHeaderBox } from './MovieHeaderBox.ts'
import type { NullMediaHeaderBox } from './NullMediaHeaderBox.ts'
import type { OriginalFormatBox } from './OriginalFormatBox.ts'
import type { PreselectionGroupBox } from './PreselectionGroupBox.ts'
import type { PrimaryItemBox } from './PrimaryItemBox.ts'
import type { ProducerReferenceTimeBox } from './ProducerReferenceTimeBox.ts'
import type { ProtectionSchemeInformationBox } from './ProtectionSchemeInformationBox.ts'
import type { ProtectionSystemSpecificHeaderBox } from './ProtectionSystemSpecificHeaderBox.ts'
import type { SampleAuxiliaryInformationOffsetsBox } from './SampleAuxiliaryInformationOffsetsBox.ts'
import type { SampleAuxiliaryInformationSizesBox } from './SampleAuxiliaryInformationSizesBox.ts'
import type { SampleDependencyTypeBox } from './SampleDependencyTypeBox.ts'
import type { SampleDescriptionBox } from './SampleDescriptionBox.ts'
import type { SampleEncryptionBox } from './SampleEncryptionBox.ts'
import type { SampleGroupDescriptionBox } from './SampleGroupDescriptionBox.ts'
import type { SampleSizeBox } from './SampleSizeBox.ts'
import type { SampleTableBox } from './SampleTableBox.ts'
import type { SampleToChunkBox } from './SampleToChunkBox.ts'
import type { SampleToGroupBox } from './SampleToGroupBox.ts'
import type { SchemeInformationBox } from './SchemeInformationBox.ts'
import type { SchemeTypeBox } from './SchemeTypeBox.ts'
import type { SegmentIndexBox } from './SegmentIndexBox.ts'
import type { SegmentTypeBox } from './SegmentTypeBox.ts'
import type { ShadowSyncSampleBox } from './ShadowSyncSampleBox.ts'
import type { SoundMediaHeaderBox } from './SoundMediaHeaderBox.ts'
import type { SubsampleInformationBox } from './SubsampleInformationBox.ts'
import type { SubsegmentIndexBox } from './SubsegmentIndexBox.ts'
import type { SubtitleMediaHeaderBox } from './SubtitleMediaHeaderBox.ts'
import type { SyncSampleBox } from './SyncSampleBox.ts'
import type { TrackBox } from './TrackBox.ts'
import type { TrackEncryptionBox } from './TrackEncryptionBox.ts'
import type { TrackExtendsBox } from './TrackExtendsBox.ts'
import type { TrackFragmentBaseMediaDecodeTimeBox } from './TrackFragmentBaseMediaDecodeTimeBox.ts'
import type { TrackFragmentBox } from './TrackFragmentBox.ts'
import type { TrackFragmentHeaderBox } from './TrackFragmentHeaderBox.ts'
import type { TrackFragmentRandomAccessBox } from './TrackFragmentRandomAccessBox.ts'
import type { TrackHeaderBox } from './TrackHeaderBox.ts'
import type { TrackKindBox } from './TrackKindBox.ts'
import type { TrackReferenceBox } from './TrackReferenceBox.ts'
import type { TrackRunBox } from './TrackRunBox.ts'
import type { UserDataBox } from './UserDataBox.ts'
import type { VideoMediaHeaderBox } from './VideoMediaHeaderBox.ts'
import type { VisualSampleEntryBox } from './VisualSampleEntryBox.ts'
import type { WebVttConfigurationBox } from './WebVttConfigurationBox.ts'
import type { WebVttCueIdBox } from './WebVttCueIdBox.ts'
import type { WebVttCuePayloadBox } from './WebVttCuePayloadBox.ts'
import type { WebVttEmptySampleBox } from './WebVttEmptySampleBox.ts'
import type { WebVttSettingsBox } from './WebVttSettingsBox.ts'
import type { WebVttSourceLabelBox } from './WebVttSourceLabelBox.ts'

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
	url: DataEntryUrlBox;
	urn: DataEntryUrnBox;
	vlab: WebVttSourceLabelBox;
	vmhd: VideoMediaHeaderBox;
	vttC: WebVttConfigurationBox;
	vtte: WebVttEmptySampleBox;
};
