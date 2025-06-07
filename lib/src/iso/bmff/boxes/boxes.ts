import type { IsoView } from '../IsoView.js';

// ============================
// Base Box Types
// ============================

/**
 * Base Box Type
 */
export type Box = {
	type: string;
	size: number;
	data?: IsoView;
	largesize?: number;
	usertype?: number[];
};

export type ContainerBox<T> = Box & {
	boxes: Array<T>;
};

/**
 * Full Box Type (has version and flags)
 */
export type FullBox = Box & {
	version: number;
	flags: number;
};

// ============================
// Container Box Types
// ============================

/**
 * File Type Box - 'ftyp'
 */
export type FileTypeBox = Box & {
	type: 'ftyp';
	majorBrand: string;
	minorVersion: number;
	compatibleBrands: string[];
};

/**
 * Movie Box - 'moov' - Container
 */
export type MovieBox = ContainerBox<MovieHeaderBox | TrackBox | MovieExtendsBox | UserDataBox> & {
	type: 'moov';
};

/**
 * Movie Header Box - 'mvhd'
 */
export type MovieHeaderBox = FullBox & {
	type: 'mvhd';
	creationTime: number;
	modificationTime: number;
	timescale: number;
	duration: number;
	rate: number;
	volume: number;
	matrix: number[];
	nextTrackId: number;
};

/**
 * Track Box - 'trak' - Container
 */
export type TrackBox = ContainerBox<TrackHeaderBox | TrackReferenceBox | EditBox | MediaBox | UserDataBox> & {
	type: 'trak';
};

/**
 * Track Header Box - 'tkhd'
 */
export type TrackHeaderBox = FullBox & {
	type: 'tkhd';
	creationTime: number;
	modificationTime: number;
	trackId: number;
	duration: number;
	layer: number;
	alternateGroup: number;
	volume: number;
	matrix: number[];
	width: number;
	height: number;
};

/**
 * Track Reference Box - 'tref' - Container
 */
export type TrackReferenceBox = ContainerBox<TrackReferenceTypeBox> & {
	type: 'tref';
};

/**
 * Track Reference Type Box
 */
export type TrackReferenceTypeBox = Box & {
	trackIds: number[];
};

/**
 * Edit Box - 'edts' - Container
 */
export type EditBox = ContainerBox<EditListBox> & {
	type: 'edts';
};

/**
 * Edit List Box - 'elst'
 */
export type EditListBox = FullBox & {
	type: 'elst';
	entryCount: number;
	entries: EditListEntry[];
};

export type EditListEntry = {
	segmentDuration: number;
	mediaTime: number;
	mediaRate: number;
};

/**
 * Media Box - 'mdia' - Container
 */
export type MediaBox = ContainerBox<MediaHeaderBox | HandlerReferenceBox | MediaInformationBox> & {
	type: 'mdia';
};

/**
 * Media Header Box - 'mdhd'
 */
export type MediaHeaderBox = FullBox & {
	type: 'mdhd';
	creationTime: number;
	modificationTime: number;
	timescale: number;
	duration: number;
	language: string;
};

/**
 * Handler Reference Box - 'hdlr'
 */
export type HandlerReferenceBox = FullBox & {
	type: 'hdlr';
	handlerType: string;
	name: string;
};

/**
 * Media Information Box - 'minf' - Container
 */
export type MediaInformationBox = ContainerBox<VideoMediaHeaderBox | SoundMediaHeaderBox | HintMediaHeaderBox | NullMediaHeaderBox | DataInformationBox | SampleTableBox> & {
	type: 'minf';
};

/**
 * Video Media Header Box - 'vmhd'
 */
export type VideoMediaHeaderBox = FullBox & {
	type: 'vmhd';
	graphicsmode: number;
	opcolor: number[];
};

/**
 * Sound Media Header Box - 'smhd'
 */
export type SoundMediaHeaderBox = FullBox & {
	type: 'smhd';
	balance: number;
};

/**
 * Hint Media Header Box - 'hmhd'
 */
export type HintMediaHeaderBox = FullBox & {
	type: 'hmhd';
	maxPDUsize: number;
	avgPDUsize: number;
	maxbitrate: number;
	avgbitrate: number;
};

/**
 * Null Media Header Box - 'nmhd'
 */
export type NullMediaHeaderBox = FullBox & {
	type: 'nmhd';
};

/**
 * Data Information Box - 'dinf' - Container
 */
export type DataInformationBox = ContainerBox<DataReferenceBox> & {
	type: 'dinf';
};

/**
 * Data Reference Box - 'dref'
 */
export type DataReferenceBox = FullBox & {
	type: 'dref';
	entryCount: number;
	boxes: Array<DataEntryUrlBox | DataEntryUrnBox>;
};

/**
 * Data Entry Url Box - 'url '
 */
export type DataEntryUrlBox = FullBox & {
	type: 'url ';
	location?: string;
};

/**
 * Data Entry Urn Box - 'urn '
 */
export type DataEntryUrnBox = FullBox & {
	type: 'urn ';
	name?: string;
	location?: string;
};

/**
 * Sample Table Box - 'stbl' - Container
 */
export type SampleTableBox = ContainerBox<SampleDescriptionBox | DecodingTimeToSampleBox | CompositionTimeToSampleBox | SampleToChunkBox | SampleSizeBox | ChunkOffsetBox | SyncSampleBox | ShadowSyncSampleBox | DegradationPriorityBox | SampleDependencyTypeBox | SampleToGroupBox | SampleGroupDescriptionBox> & {
	type: 'stbl';
};

/**
 * Sample Description Box - 'stsd'
 */
export type SampleDescriptionBox = FullBox & {
	type: 'stsd';
	entryCount: number;
	boxes: Array<SampleEntry>;
};

/**
 * Sample Entry base type
 */
export type SampleEntry = Box & {
	dataReferenceIndex: number;
};

/**
 * Visual Sample Entry - 'avc1', 'avc2', 'avc3', 'avc4', 'hev1', 'hvc1', etc.
 */
export type VisualSampleEntry = SampleEntry & ContainerBox<Box> & {
	width: number;
	height: number;
	horizresolution: number;
	vertresolution: number;
	frameCount: number;
	compressorName: string;
	depth: number;
};

/**
 * Audio Sample Entry - 'mp4a', etc.
 */
export type AudioSampleEntry = SampleEntry & ContainerBox<Box> & {
	channelcount: number;
	samplesize: number;
	samplerate: number;
};

/**
 * Decoding Time to Sample Box - 'stts'
 */
export type DecodingTimeToSampleBox = FullBox & {
	type: 'stts';
	entryCount: number;
	entries: TimeToSampleEntry[];
};

export type TimeToSampleEntry = {
	sampleCount: number;
	sampleDelta: number;
};

/**
 * Composition Time to Sample Box - 'ctts'
 */
export type CompositionTimeToSampleBox = FullBox & {
	type: 'ctts';
	entryCount: number;
	entries: CompTimeToSampleEntry[];
};

export type CompTimeToSampleEntry = {
	sampleCount: number;
	sampleOffset: number;
};

/**
 * Sample to Chunk Box - 'stsc'
 */
export type SampleToChunkBox = FullBox & {
	type: 'stsc';
	entryCount: number;
	entries: SampleToChunkEntry[];
};

export type SampleToChunkEntry = {
	firstChunk: number;
	samplesPerChunk: number;
	sampleDescriptionIndex: number;
};

/**
 * Sample Size Box - 'stsz'
 */
export type SampleSizeBox = FullBox & {
	type: 'stsz';
	sampleSize: number;
	sampleCount: number;
	entrySize?: number[];
};

/**
 * Compact Sample Size Box - 'stz2'
 */
export type CompactSampleSizeBox = FullBox & {
	type: 'stz2';
	fieldSize: number;
	sampleCount: number;
	entrySize: number[];
};

/**
 * Chunk Offset Box - 'stco'
 */
export type ChunkOffsetBox = FullBox & {
	type: 'stco';
	entryCount: number;
	chunkOffset: number[];
};

/**
 * Chunk Large Offset Box - 'co64'
 */
export type ChunkLargeOffsetBox = FullBox & {
	type: 'co64';
	entryCount: number;
	chunkOffset: number[];
};

/**
 * Sync Sample Box - 'stss'
 */
export type SyncSampleBox = FullBox & {
	type: 'stss';
	entryCount: number;
	sampleNumber: number[];
};

/**
 * Shadow Sync Sample Box - 'stsh'
 */
export type ShadowSyncSampleBox = FullBox & {
	type: 'stsh';
	entryCount: number;
	entries: ShadowSyncEntry[];
};

export type ShadowSyncEntry = {
	shadowedSampleNumber: number;
	syncSampleNumber: number;
};

/**
 * Degradation Priority Box - 'stdp'
 */
export type DegradationPriorityBox = FullBox & {
	type: 'stdp';
	priority: number[];
};

/**
 * Sample Dependency Type Box - 'sdtp'
 */
export type SampleDependencyTypeBox = FullBox & {
	type: 'sdtp';
	sampleDependencyType: number[];
};

/**
 * Sample to Group Box - 'sbgp'
 */
export type SampleToGroupBox = FullBox & {
	type: 'sbgp';
	groupingType: number;
	groupingTypeParameter?: number;
	entryCount: number;
	entries: SampleToGroupEntry[];
};

export type SampleToGroupEntry = {
	sampleCount: number;
	groupDescriptionIndex: number;
};

/**
 * Sample Group Description Box - 'sgpd'
 */
export type SampleGroupDescriptionBox = FullBox & {
	type: 'sgpd';
	groupingType: number;
	defaultLength?: number;
	entryCount: number;
	entries: any[];
};

// ============================
// Movie Fragment Boxes
// ============================

/**
 * Movie Fragment Box - 'moof' - Container
 */
export type MovieFragmentBox = ContainerBox<MovieFragmentHeaderBox | TrackFragmentBox> & {
	type: 'moof';
};

/**
 * Movie Fragment Header Box - 'mfhd'
 */
export type MovieFragmentHeaderBox = FullBox & {
	type: 'mfhd';
	sequenceNumber: number;
};

/**
 * Track Fragment Box - 'traf' - Container
 */
export type TrackFragmentBox = ContainerBox<TrackFragmentHeaderBox | TrackFragmentBaseMediaDecodeTimeBox | TrackFragmentRunBox | SampleAuxiliaryInformationSizesBox | SampleAuxiliaryInformationOffsetsBox | SampleEncryptionBox> & {
	type: 'traf';
};

/**
 * Track Fragment Header Box - 'tfhd'
 */
export type TrackFragmentHeaderBox = FullBox & {
	type: 'tfhd';
	trackId: number;
	baseDataOffset?: number;
	sampleDescriptionIndex?: number;
	defaultSampleDuration?: number;
	defaultSampleSize?: number;
	defaultSampleFlags?: number;
};

/**
 * Track Fragment Base Media Decode Time Box - 'tfdt'
 */
export type TrackFragmentBaseMediaDecodeTimeBox = FullBox & {
	type: 'tfdt';
	baseMediaDecodeTime: number;
};

/**
 * Track Fragment Run Box - 'trun'
 */
export type TrackFragmentRunBox = FullBox & {
	type: 'trun';
	sampleCount: number;
	dataOffset?: number;
	firstSampleFlags?: number;
	samples: TrackRunSample[];
};

export type TrackRunSample = {
	sampleDuration?: number;
	sampleSize?: number;
	sampleFlags?: number;
	sampleCompositionTimeOffset?: number;
};

/**
 * Movie Fragment Random Access Box - 'mfra' - Container
 */
export type MovieFragmentRandomAccessBox = ContainerBox<TrackFragmentRandomAccessBox | MovieFragmentRandomAccessOffsetBox> & {
	type: 'mfra';
};

/**
 * Track Fragment Random Access Box - 'tfra'
 */
export type TrackFragmentRandomAccessBox = FullBox & {
	type: 'tfra';
	trackId: number;
	lengthSizeOfTrafNum: number;
	lengthSizeOfTrunNum: number;
	lengthSizeOfSampleNum: number;
	numberOfEntry: number;
	entries: TrackFragmentRandomAccessEntry[];
};

export type TrackFragmentRandomAccessEntry = {
	time: number;
	moofOffset: number;
	trafNumber: number;
	trunNumber: number;
	sampleNumber: number;
};

/**
 * Movie Fragment Random Access Offset Box - 'mfro'
 */
export type MovieFragmentRandomAccessOffsetBox = FullBox & {
	type: 'mfro';
	mfraSize: number;
};

// ============================
// Movie Extends Boxes
// ============================

/**
 * Movie Extends Box - 'mvex' - Container
 */
export type MovieExtendsBox = ContainerBox<MovieExtendsHeaderBox | TrackExtendsBox> & {
	type: 'mvex';
};

/**
 * Movie Extends Header Box - 'mehd'
 */
export type MovieExtendsHeaderBox = FullBox & {
	type: 'mehd';
	fragmentDuration: number;
};

/**
 * Track Extends Box - 'trex'
 */
export type TrackExtendsBox = FullBox & {
	type: 'trex';
	trackId: number;
	defaultSampleDescriptionIndex: number;
	defaultSampleDuration: number;
	defaultSampleSize: number;
	defaultSampleFlags: number;
};

// ============================
// Protection Boxes
// ============================

/**
 * Protection Scheme Information Box - 'sinf' - Container
 */
export type ProtectionSchemeInformationBox = ContainerBox<OriginalFormatBox | IPMPInfoBox | SchemeTypeBox | SchemeInformationBox> & {
	type: 'sinf';
};

/**
 * Original Format Box - 'frma'
 */
export type OriginalFormatBox = Box & {
	type: 'frma';
	dataFormat: string;
};

/**
 * IPMP Info Box - 'imif'
 */
export type IPMPInfoBox = FullBox & {
	type: 'imif';
	ipmpDescr: any[];
};

/**
 * Scheme Type Box - 'schm'
 */
export type SchemeTypeBox = FullBox & {
	type: 'schm';
	schemeType: string;
	schemeVersion: number;
	schemeUri?: string;
};

/**
 * Scheme Information Box - 'schi' - Container
 */
export type SchemeInformationBox = ContainerBox<TrackEncryptionBox | Box> & {
	type: 'schi';
};

/**
 * Track Encryption Box - 'tenc'
 */
export type TrackEncryptionBox = FullBox & {
	type: 'tenc';
	defaultIsProtected: number;
	defaultPerSampleIVSize: number;
	defaultKID: Uint8Array;
	defaultConstantIVSize?: number;
	defaultConstantIV?: Uint8Array;
};

/**
 * Protection System Specific Header Box - 'pssh'
 */
export type ProtectionSystemSpecificHeaderBox = FullBox & {
	type: 'pssh';
	systemId: Uint8Array;
	KIDs?: Uint8Array[];
	data: Uint8Array;
};

/**
 * Sample Encryption Box - 'senc'
 */
export type SampleEncryptionBox = FullBox & {
	type: 'senc';
	sampleCount: number;
	samples: EncryptedSample[];
};

export type EncryptedSample = {
	initializationVector?: Uint8Array;
	subsampleEncryption?: SubsampleEncryption[];
};

export type SubsampleEncryption = {
	bytesOfClearData: number;
	bytesOfProtectedData: number;
};

/**
 * Sample Auxiliary Information Sizes Box - 'saiz'
 */
export type SampleAuxiliaryInformationSizesBox = FullBox & {
	type: 'saiz';
	auxInfoType?: number;
	auxInfoTypeParameter?: number;
	defaultSampleInfoSize: number;
	sampleCount: number;
	sampleInfoSize?: number[];
};

/**
 * Sample Auxiliary Information Offsets Box - 'saio'
 */
export type SampleAuxiliaryInformationOffsetsBox = FullBox & {
	type: 'saio';
	auxInfoType?: number;
	auxInfoTypeParameter?: number;
	entryCount: number;
	offset: number[];
};

// ============================
// Metadata Boxes
// ============================

/**
 * Meta Box - 'meta' - Container
 */
export type MetaBox = ContainerBox<HandlerReferenceBox | PrimaryItemBox | DataInformationBox | ItemLocationBox | ItemProtectionBox | ItemInfoBox | ItemReferenceBox> & {
	type: 'meta';
};

/**
 * Primary Item Box - 'pitm'
 */
export type PrimaryItemBox = FullBox & {
	type: 'pitm';
	itemId: number;
};

/**
 * Item Location Box - 'iloc'
 */
export type ItemLocationBox = FullBox & {
	type: 'iloc';
	offsetSize: number;
	lengthSize: number;
	baseOffsetSize: number;
	indexSize?: number;
	itemCount: number;
	items: ItemLocation[];
};

export type ItemLocation = {
	itemId: number;
	constructionMethod?: number;
	dataReferenceIndex: number;
	baseOffset: number;
	extents: ItemExtent[];
};

export type ItemExtent = {
	extentIndex?: number;
	extentOffset: number;
	extentLength: number;
};

/**
 * Item Protection Box - 'ipro' - Container
 */
export type ItemProtectionBox = ContainerBox<ProtectionSchemeInformationBox> & {
	type: 'ipro';
	protectionCount: number;
};

/**
 * Item Info Box - 'iinf' - Container
 */
export type ItemInfoBox = ContainerBox<ItemInfoEntry> & {
	type: 'iinf';
	entryCount: number;
};

/**
 * Item Info Entry - 'infe'
 */
export type ItemInfoEntry = FullBox & {
	type: 'infe';
	itemId: number;
	itemProtectionIndex: number;
	itemName: string;
	contentType: string;
	contentEncoding?: string;
	extensionType?: string;
};

/**
 * Item Reference Box - 'iref' - Container
 */
export type ItemReferenceBox = ContainerBox<SingleItemTypeReferenceBox> & {
	type: 'iref';
};

/**
 * Single Item Type Reference Box
 */
export type SingleItemTypeReferenceBox = Box & {
	fromItemId: number;
	referenceCount: number;
	toItemId: number[];
};

// ============================
// Other Important Boxes
// ============================

/**
 * Media Data Box - 'mdat'
 */
export type MediaDataBox = Box & {
	type: 'mdat';
	data: Uint8Array;
};

/**
 * Free Space Box - 'free' or 'skip'
 */
export type FreeSpaceBox = Box & {
	type: 'free' | 'skip';
	data: Uint8Array;
};

/**
 * User Data Box - 'udta' - Container
 */
export type UserDataBox = ContainerBox<Box> & {
	type: 'udta';
};

/**
 * Segment Type Box - 'styp'
 */
export type SegmentTypeBox = Box & {
	type: 'styp';
	majorBrand: string;
	minorVersion: number;
	compatibleBrands: string[];
};

/**
 * Segment Index Box - 'sidx'
 */
export type SegmentIndexBox = FullBox & {
	type: 'sidx';
	referenceId: number;
	timescale: number;
	earliestPresentationTime: number;
	firstOffset: number;
	referenceCount: number;
	references: SegmentReference[];
};

export type SegmentReference = {
	referenceType: number;
	referencedSize: number;
	subsegmentDuration: number;
	startsWithSAP: number;
	sapType: number;
	sapDeltaTime: number;
};

/**
 * Subsegment Index Box - 'ssix'
 */
export type SubsegmentIndexBox = FullBox & {
	type: 'ssix';
	subsegmentCount: number;
	subsegments: Subsegment[];
};

export type Subsegment = {
	rangeCount: number;
	ranges: SubsegmentRange[];
};

export type SubsegmentRange = {
	level: number;
	rangeSize: number;
};

/**
 * Producer Reference Time Box - 'prft'
 */
export type ProducerReferenceTimeBox = FullBox & {
	type: 'prft';
	referenceTrackId: number;
	ntpTimestamp: number;
	mediaTime: number;
};

/**
 * Event Message Box - 'emsg'
 */
export type EventMessageBox = FullBox & {
	type: 'emsg';
	schemeIdUri: string;
	value: string;
	timescale: number;
	presentationTimeDelta?: number;
	presentationTime?: number;
	eventDuration: number;
	id: number;
	messageData: Uint8Array;
};

// ============================
// Union Types
// ============================

/**
 * All possible ISO BMFF Box types
 */
export type AllBoxTypes =
	| ContainerBoxTypes
	| FileTypeBox
	| MovieHeaderBox
	| TrackHeaderBox
	| EditListBox
	| MediaHeaderBox
	| HandlerReferenceBox
	| VideoMediaHeaderBox
	| SoundMediaHeaderBox
	| HintMediaHeaderBox
	| NullMediaHeaderBox
	| DataReferenceBox
	| DataEntryUrlBox
	| DataEntryUrnBox
	| SampleDescriptionBox
	| VisualSampleEntry
	| AudioSampleEntry
	| DecodingTimeToSampleBox
	| CompositionTimeToSampleBox
	| SampleToChunkBox
	| SampleSizeBox
	| CompactSampleSizeBox
	| ChunkOffsetBox
	| ChunkLargeOffsetBox
	| SyncSampleBox
	| ShadowSyncSampleBox
	| DegradationPriorityBox
	| SampleDependencyTypeBox
	| SampleToGroupBox
	| SampleGroupDescriptionBox
	| MovieFragmentHeaderBox
	| TrackFragmentHeaderBox
	| TrackFragmentBaseMediaDecodeTimeBox
	| TrackFragmentRunBox
	| TrackFragmentRandomAccessBox
	| MovieFragmentRandomAccessOffsetBox
	| MovieExtendsHeaderBox
	| TrackExtendsBox
	| OriginalFormatBox
	| IPMPInfoBox
	| SchemeTypeBox
	| TrackEncryptionBox
	| ProtectionSystemSpecificHeaderBox
	| SampleEncryptionBox
	| SampleAuxiliaryInformationSizesBox
	| SampleAuxiliaryInformationOffsetsBox
	| PrimaryItemBox
	| ItemLocationBox
	| ItemInfoEntry
	| SingleItemTypeReferenceBox
	| MediaDataBox
	| FreeSpaceBox
	| SegmentTypeBox
	| SegmentIndexBox
	| SubsegmentIndexBox
	| ProducerReferenceTimeBox
	| EventMessageBox;

/**
 * Container boxes that can contain other boxes
 */
export type ContainerBoxTypes =
	| MovieBox
	| TrackBox
	| TrackReferenceBox
	| EditBox
	| MediaBox
	| MediaInformationBox
	| DataInformationBox
	| SampleTableBox
	| MovieFragmentBox
	| TrackFragmentBox
	| MovieFragmentRandomAccessBox
	| MovieExtendsBox
	| ProtectionSchemeInformationBox
	| SchemeInformationBox
	| MetaBox
	| ItemProtectionBox
	| ItemInfoBox
	| ItemReferenceBox
	| UserDataBox;
