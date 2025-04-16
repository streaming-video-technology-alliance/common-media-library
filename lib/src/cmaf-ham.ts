/**
 * @packageDocumentation
 *
 * A collection of tools for working with Common Media Application Format - Hypothetical Application Model (CMAF-HAM).
 *
 * @alpha
 */
export type { AlignedSwitchingSet } from './cmaf/ham/types/model/AlignedSwitchingSet.ts';
export type { AudioTrack } from './cmaf/ham/types/model/AudioTrack.ts';
export type { FrameRate } from './cmaf/ham/types/model/FrameRate.ts';
export type { Ham } from './cmaf/ham/types/model/Ham.ts';
export type { Presentation } from './cmaf/ham/types/model/Presentation.ts';
export type { Segment } from './cmaf/ham/types/model/Segment.ts';
export type { SelectionSet } from './cmaf/ham/types/model/SelectionSet.ts';
export type { SwitchingSet } from './cmaf/ham/types/model/SwitchingSet.ts';
export type { TextTrack } from './cmaf/ham/types/model/TextTrack.ts';
export type { Track } from './cmaf/ham/types/model/Track.ts';
export type { TrackType } from './cmaf/ham/types/model/TrackType.ts';
export type { VideoTrack } from './cmaf/ham/types/model/VideoTrack.ts';

export type { Manifest } from './cmaf/ham/types/manifest/Manifest.ts';
export type { ManifestFormat } from './cmaf/ham/types/manifest/ManifestFormat.ts';
export type { AdaptationSet } from './cmaf/ham/types/mapper/dash/AdaptationSet.ts';
export type { AudioChannelConfiguration } from './cmaf/ham/types/mapper/dash/AudioChannelConfiguration.ts';
export type { ContentComponent } from './cmaf/ham/types/mapper/dash/ContentComponent.ts';
export type { DashManifest } from './cmaf/ham/types/mapper/dash/DashManifest.ts';
export type { Initialization } from './cmaf/ham/types/mapper/dash/Initialization.ts';
export type { Period } from './cmaf/ham/types/mapper/dash/Period.ts';
export type { Representation } from './cmaf/ham/types/mapper/dash/Representation.ts';
export type { Role } from './cmaf/ham/types/mapper/dash/Role.ts';
export type { SegmentBase } from './cmaf/ham/types/mapper/dash/SegmentBase.ts';
export type { SegmentList } from './cmaf/ham/types/mapper/dash/SegmentList.ts';
export type { SegmentTemplate } from './cmaf/ham/types/mapper/dash/SegmentTemplate.ts';
export type { SegmentURL } from './cmaf/ham/types/mapper/dash/SegmentUrl.ts';
export type { Byterange } from './cmaf/ham/types/mapper/hls/Byterange.ts';
export type { HlsManifest } from './cmaf/ham/types/mapper/hls/HlsManifest.ts';
export type { MediaGroups } from './cmaf/ham/types/mapper/hls/MediaGroups.ts';
export type { PlayList } from './cmaf/ham/types/mapper/hls/Playlist.ts';
export type { SegmentHls } from './cmaf/ham/types/mapper/hls/SegmentHls.ts';
export type { Validation } from './cmaf/ham/types/Validation.ts';

export { setDashParser } from './cmaf/ham/utils/dash/parseDashManifest.ts';
export { setDashSerializer } from './cmaf/ham/utils/dash/serializeDashManifest.ts';
export { setHlsParser } from './cmaf/ham/utils/hls/parseHlsManifest.ts';

export { dashToHam } from './cmaf/ham/services/converters/dashToHam.ts';
export { hamToDash } from './cmaf/ham/services/converters/hamToDash.ts';
export { hamToHls } from './cmaf/ham/services/converters/hamToHls.ts';
export { hlsToHam } from './cmaf/ham/services/converters/hlsToHam.ts';

export { getTracksFromPresentation } from './cmaf/ham/services/getters/getTracksFromPresentation.ts';
export { getTracksFromSelectionSet } from './cmaf/ham/services/getters/getTracksFromSelectionSet.ts';
export { getTracksFromSwitchingSet } from './cmaf/ham/services/getters/getTracksFromSwitchingSet.ts';

export { validatePresentation } from './cmaf/ham/services/validators/validatePresentation.ts';
export { validateSegment } from './cmaf/ham/services/validators/validateSegment.ts';
export { validateSegments } from './cmaf/ham/services/validators/validateSegments.ts';
export { validateSelectionSet } from './cmaf/ham/services/validators/validateSelectionSet.ts';
export { validateSelectionSets } from './cmaf/ham/services/validators/validateSelectionSets.ts';
export { validateSwitchingSet } from './cmaf/ham/services/validators/validateSwitchingSet.ts';
export { validateSwitchingSets } from './cmaf/ham/services/validators/validateSwitchingSets.ts';
export { validateTrack } from './cmaf/ham/services/validators/validateTrack.ts';
export { validateTracks } from './cmaf/ham/services/validators/validateTracks.ts';
