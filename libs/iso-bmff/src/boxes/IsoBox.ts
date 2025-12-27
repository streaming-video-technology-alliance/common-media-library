import type { AudioRenderingIndicationBox } from './AudioRenderingIndicationBox.ts'
import type { AudioSampleEntryBox } from './AudioSampleEntryBox.ts'
import type { ChunkLargeOffsetBox } from './ChunkLargeOffsetBox.ts'
import type { ChunkOffsetBox } from './ChunkOffsetBox.ts'
import type { CompactSampleSizeBox } from './CompactSampleSizeBox.ts'
import type { CompositionTimeToSampleBox } from './CompositionTimeToSampleBox.ts'
import type { DataEntryUrlBox } from './DataEntryUrlBox.ts'
import type { DataEntryUrnBox } from './DataEntryUrnBox.ts'
import type { DataReferenceBox } from './DataReferenceBox.ts'
import type { DecodingTimeToSampleBox } from './DecodingTimeToSampleBox.ts'
import type { DegradationPriorityBox } from './DegradationPriorityBox.ts'
import type { EditListBox } from './EditListBox.ts'
import type { EventMessageBox } from './EventMessageBox.ts'
import type { ExtendedLanguageBox } from './ExtendedLanguageBox.ts'
import type { FileTypeBox } from './FileTypeBox.ts'
import type { FreeSpaceBox } from './FreeSpaceBox.ts'
import type { HandlerReferenceBox } from './HandlerReferenceBox.ts'
import type { HintMediaHeaderBox } from './HintMediaHeaderBox.ts'
import type { IdentifiedMediaDataBox } from './IdentifiedMediaDataBox.ts'
import type { IpmpInfoBox } from './IpmpInfoBox.ts'
import type { ItemInfoEntry } from './ItemInfoEntry.ts'
import type { ItemLocationBox } from './ItemLocationBox.ts'
import type { LabelBox } from './LabelBox.ts'
import type { MediaDataBox } from './MediaDataBox.ts'
import type { MediaHeaderBox } from './MediaHeaderBox.ts'
import type { MovieExtendsHeaderBox } from './MovieExtendsHeaderBox.ts'
import type { MovieFragmentHeaderBox } from './MovieFragmentHeaderBox.ts'
import type { MovieFragmentRandomAccessOffsetBox } from './MovieFragmentRandomAccessOffsetBox.ts'
import type { MovieHeaderBox } from './MovieHeaderBox.ts'
import type { NullMediaHeaderBox } from './NullMediaHeaderBox.ts'
import type { OriginalFormatBox } from './OriginalFormatBox.ts'
import type { PreselectionGroupBox } from './PreselectionGroupBox.ts'
import type { PrimaryItemBox } from './PrimaryItemBox.ts'
import type { ProducerReferenceTimeBox } from './ProducerReferenceTimeBox.ts'
import type { ProtectionSystemSpecificHeaderBox } from './ProtectionSystemSpecificHeaderBox.ts'
import type { SampleAuxiliaryInformationOffsetsBox } from './SampleAuxiliaryInformationOffsetsBox.ts'
import type { SampleAuxiliaryInformationSizesBox } from './SampleAuxiliaryInformationSizesBox.ts'
import type { SampleDependencyTypeBox } from './SampleDependencyTypeBox.ts'
import type { SampleDescriptionBox } from './SampleDescriptionBox.ts'
import type { SampleEncryptionBox } from './SampleEncryptionBox.ts'
import type { SampleGroupDescriptionBox } from './SampleGroupDescriptionBox.ts'
import type { SampleSizeBox } from './SampleSizeBox.ts'
import type { SampleToChunkBox } from './SampleToChunkBox.ts'
import type { SampleToGroupBox } from './SampleToGroupBox.ts'
import type { SchemeTypeBox } from './SchemeTypeBox.ts'
import type { SegmentIndexBox } from './SegmentIndexBox.ts'
import type { SegmentTypeBox } from './SegmentTypeBox.ts'
import type { ShadowSyncSampleBox } from './ShadowSyncSampleBox.ts'
import type { SingleItemTypeReferenceBox } from './SingleItemTypeReferenceBox.ts'
import type { SoundMediaHeaderBox } from './SoundMediaHeaderBox.ts'
import type { SubsampleInformationBox } from './SubsampleInformationBox.ts'
import type { SubsegmentIndexBox } from './SubsegmentIndexBox.ts'
import type { SubtitleMediaHeaderBox } from './SubtitleMediaHeaderBox.ts'
import type { SyncSampleBox } from './SyncSampleBox.ts'
import type { TrackEncryptionBox } from './TrackEncryptionBox.ts'
import type { TrackExtendsBox } from './TrackExtendsBox.ts'
import type { TrackFragmentBaseMediaDecodeTimeBox } from './TrackFragmentBaseMediaDecodeTimeBox.ts'
import type { TrackFragmentHeaderBox } from './TrackFragmentHeaderBox.ts'
import type { TrackFragmentRandomAccessBox } from './TrackFragmentRandomAccessBox.ts'
import type { TrackHeaderBox } from './TrackHeaderBox.ts'
import type { TrackKindBox } from './TrackKindBox.ts'
import type { TrackRunBox } from './TrackRunBox.ts'
import type { UrlBox } from './UrlBox.ts'
import type { UrnBox } from './UrnBox.ts'
import type { VideoMediaHeaderBox } from './VideoMediaHeaderBox.ts'
import type { VisualSampleEntryBox } from './VisualSampleEntryBox.ts'
import type { WebVttConfigurationBox } from './WebVttConfigurationBox.ts'
import type { WebVttCueIdBox } from './WebVttCueIdBox.ts'
import type { WebVttCuePayloadBox } from './WebVttCuePayloadBox.ts'
import type { WebVttEmptySampleBox } from './WebVttEmptySampleBox.ts'
import type { WebVttSettingsBox } from './WebVttSettingsBox.ts'
import type { WebVttSourceLabelBox } from './WebVttSourceLabelBox.ts'

/**
 * Non-container Box types
 *
 * @public
 */
export type IsoBox =
	| AudioRenderingIndicationBox
	| AudioSampleEntryBox<'enca'>
	| AudioSampleEntryBox<'mp4a'>
	| ChunkLargeOffsetBox
	| ChunkOffsetBox
	| CompactSampleSizeBox
	| CompositionTimeToSampleBox
	| DataEntryUrlBox
	| DataEntryUrnBox
	| DataReferenceBox
	| DecodingTimeToSampleBox
	| DegradationPriorityBox
	| EditListBox
	| EventMessageBox
	| ExtendedLanguageBox
	| FileTypeBox
	| FreeSpaceBox<'free'>
	| FreeSpaceBox<'skip'>
	| HandlerReferenceBox
	| HintMediaHeaderBox
	| IdentifiedMediaDataBox
	| IpmpInfoBox
	| ItemInfoEntry
	| ItemLocationBox
	| LabelBox
	| MediaDataBox
	| MediaHeaderBox
	| MovieExtendsHeaderBox
	| MovieFragmentHeaderBox
	| MovieFragmentRandomAccessOffsetBox
	| MovieHeaderBox
	| NullMediaHeaderBox
	| OriginalFormatBox
	| PrimaryItemBox
	| PreselectionGroupBox
	| ProducerReferenceTimeBox
	| ProtectionSystemSpecificHeaderBox
	| SampleAuxiliaryInformationOffsetsBox
	| SampleAuxiliaryInformationSizesBox
	| SampleDependencyTypeBox
	| SampleDescriptionBox
	| SampleEncryptionBox
	| SampleGroupDescriptionBox
	| SampleSizeBox
	| SampleToChunkBox
	| SampleToGroupBox
	| SchemeTypeBox
	| SegmentIndexBox
	| SegmentTypeBox
	| ShadowSyncSampleBox
	| SingleItemTypeReferenceBox
	| SoundMediaHeaderBox
	| SubsampleInformationBox
	| SubsegmentIndexBox
	| SubtitleMediaHeaderBox
	| SyncSampleBox
	| TrackEncryptionBox
	| TrackExtendsBox
	| TrackFragmentBaseMediaDecodeTimeBox
	| TrackFragmentHeaderBox
	| TrackFragmentRandomAccessBox
	| TrackHeaderBox
	| TrackKindBox
	| TrackRunBox
	| UrlBox
	| UrnBox
	| VideoMediaHeaderBox
	| VisualSampleEntryBox<'avc1'>
	| VisualSampleEntryBox<'avc2'>
	| VisualSampleEntryBox<'avc3'>
	| VisualSampleEntryBox<'avc4'>
	| VisualSampleEntryBox<'encv'>
	| VisualSampleEntryBox<'hev1'>
	| VisualSampleEntryBox<'hvc1'>
	| WebVttConfigurationBox
	| WebVttCueIdBox
	| WebVttCuePayloadBox
	| WebVttEmptySampleBox
	| WebVttSettingsBox
	| WebVttSourceLabelBox;
