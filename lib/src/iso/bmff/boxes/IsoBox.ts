import type { AudioRenderingIndicationBox } from './AudioRenderingIndicationBox.js';
import type { AudioSampleEntryBox } from './AudioSampleEntryBox.js';
import type { ChunkLargeOffsetBox } from './ChunkLargeOffsetBox.js';
import type { ChunkOffsetBox } from './ChunkOffsetBox.js';
import type { CompactSampleSizeBox } from './CompactSampleSizeBox.js';
import type { CompositionTimeToSampleBox } from './CompositionTimeToSampleBox.js';
import type { DataEntryUrlBox } from './DataEntryUrlBox.js';
import type { DataEntryUrnBox } from './DataEntryUrnBox.js';
import type { DataReferenceBox } from './DataReferenceBox.js';
import type { DecodingTimeToSampleBox } from './DecodingTimeToSampleBox.js';
import type { DegradationPriorityBox } from './DegradationPriorityBox.js';
import type { EditListBox } from './EditListBox.js';
import type { EventMessageBox } from './EventMessageBox.js';
import type { ExtendedLanguageBox } from './ExtendedLanguageBox.js';
import type { FileTypeBox } from './FileTypeBox.js';
import type { FreeSpaceBox } from './FreeSpaceBox.js';
import type { HandlerReferenceBox } from './HandlerReferenceBox.js';
import type { HintMediaHeaderBox } from './HintMediaHeaderBox.js';
import type { IdentifiedMediaDataBox } from './IdentifiedMediaDataBox.js';
import type { IpmpInfoBox } from './IpmpInfoBox.js';
import type { ItemInfoEntry } from './ItemInfoEntry.js';
import type { ItemLocationBox } from './ItemLocationBox.js';
import type { LabelBox } from './LabelBox.js';
import type { MediaDataBox } from './MediaDataBox.js';
import type { MediaHeaderBox } from './MediaHeaderBox.js';
import type { MovieExtendsHeaderBox } from './MovieExtendsHeaderBox.js';
import type { MovieFragmentHeaderBox } from './MovieFragmentHeaderBox.js';
import type { MovieFragmentRandomAccessOffsetBox } from './MovieFragmentRandomAccessOffsetBox.js';
import type { MovieHeaderBox } from './MovieHeaderBox.js';
import type { NullMediaHeaderBox } from './NullMediaHeaderBox.js';
import type { OriginalFormatBox } from './OriginalFormatBox.js';
import type { PreselectionGroupBox } from './PreselectionGroupBox.js';
import type { PrimaryItemBox } from './PrimaryItemBox.js';
import type { ProducerReferenceTimeBox } from './ProducerReferenceTimeBox.js';
import type { ProtectionSystemSpecificHeaderBox } from './ProtectionSystemSpecificHeaderBox.js';
import type { SampleAuxiliaryInformationOffsetsBox } from './SampleAuxiliaryInformationOffsetsBox.js';
import type { SampleAuxiliaryInformationSizesBox } from './SampleAuxiliaryInformationSizesBox.js';
import type { SampleDependencyTypeBox } from './SampleDependencyTypeBox.js';
import type { SampleDescriptionBox } from './SampleDescriptionBox.js';
import type { SampleEncryptionBox } from './SampleEncryptionBox.js';
import type { SampleGroupDescriptionBox } from './SampleGroupDescriptionBox.js';
import type { SampleSizeBox } from './SampleSizeBox.js';
import type { SampleToChunkBox } from './SampleToChunkBox.js';
import type { SampleToGroupBox } from './SampleToGroupBox.js';
import type { SchemeTypeBox } from './SchemeTypeBox.js';
import type { SegmentIndexBox } from './SegmentIndexBox.js';
import type { SegmentTypeBox } from './SegmentTypeBox.js';
import type { ShadowSyncSampleBox } from './ShadowSyncSampleBox.js';
import type { SingleItemTypeReferenceBox } from './SingleItemTypeReferenceBox.js';
import type { SoundMediaHeaderBox } from './SoundMediaHeaderBox.js';
import type { SubsampleInformationBox } from './SubsampleInformationBox.js';
import type { SubsegmentIndexBox } from './SubsegmentIndexBox.js';
import type { SubtitleMediaHeaderBox } from './SubtitleMediaHeaderBox.js';
import type { SyncSampleBox } from './SyncSampleBox.js';
import type { TrackEncryptionBox } from './TrackEncryptionBox.js';
import type { TrackExtendsBox } from './TrackExtendsBox.js';
import type { TrackFragmentBaseMediaDecodeTimeBox } from './TrackFragmentBaseMediaDecodeTimeBox.js';
import type { TrackFragmentHeaderBox } from './TrackFragmentHeaderBox.js';
import type { TrackFragmentRandomAccessBox } from './TrackFragmentRandomAccessBox.js';
import type { TrackFragmentRunBox } from './TrackFragmentRunBox.js';
import type { TrackHeaderBox } from './TrackHeaderBox.js';
import type { TrackKindBox } from './TrackKindBox.js';
import type { TrackRunBox } from './TrackRunBox.js';
import type { UrlBox } from './UrlBox.js';
import type { UrnBox } from './UrnBox.js';
import type { VideoMediaHeaderBox } from './VideoMediaHeaderBox.js';
import type { VisualSampleEntryBox } from './VisualSampleEntryBox.js';
import type { WebVttConfigurationBox } from './WebVttConfigurationBox.js';
import type { WebVttCueIdBox } from './WebVttCueIdBox.js';
import type { WebVttCuePayloadBox } from './WebVttCuePayloadBox.js';
import type { WebVttEmptySampleBox } from './WebVttEmptySampleBox.js';
import type { WebVttSettingsBox } from './WebVttSettingsBox.js';
import type { WebVttSourceLabelBox } from './WebVttSourceLabelBox.js';

/**
 * Non-container Box types
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type IsoBox =
	| AudioRenderingIndicationBox
	| AudioSampleEntryBox
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
	| FreeSpaceBox
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
	| TrackFragmentRunBox
	| TrackHeaderBox
	| TrackKindBox
	| TrackRunBox
	| UrlBox
	| UrnBox
	| VideoMediaHeaderBox
	| VisualSampleEntryBox
	| WebVttConfigurationBox
	| WebVttCueIdBox
	| WebVttCuePayloadBox
	| WebVttEmptySampleBox
	| WebVttSettingsBox
	| WebVttSourceLabelBox;
