export const mpdSample5: string = `<?xml version="1.0" encoding="UTF-8"?>
<MPD xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="urn:mpeg:dash:schema:mpd:2011" xmlns:cenc="urn:mpeg:cenc:2013" xsi:schemaLocation="urn:mpeg:dash:schema:mpd:2011 http://standards.iso.org/ittf/PubliclyAvailableStandards/MPEG-DASH_schema_files/DASH-MPD.xsd" type="static" minBufferTime="PT10S" profiles="urn:mpeg:dash:profile:isoff-main:2011" mediaPresentationDuration="PT50S">
  <Period start="PT0S" duration="PT50S" id="1">
    <AdaptationSet mimeType="video/mp4" frameRate="30/1" segmentAlignment="true" subsegmentAlignment="true" startWithSAP="1" subsegmentStartsWithSAP="1" bitstreamSwitching="false">
      <SegmentList timescale="90000" duration="900000">
        <Initialization sourceURL="https://cmaf-ham-sample-bucket.s3.amazonaws.com/output-mediaconvert/big buck bunny sampleh264-videoinit.cmfv" />
        <SegmentURL media="https://cmaf-ham-sample-bucket.s3.amazonaws.com/output-mediaconvert/big buck bunny sampleh264-video_000000001.cmfv" />
        <SegmentURL media="https://cmaf-ham-sample-bucket.s3.amazonaws.com/output-mediaconvert/big buck bunny sampleh264-video_000000002.cmfv" />
        <SegmentURL media="https://cmaf-ham-sample-bucket.s3.amazonaws.com/output-mediaconvert/big buck bunny sampleh264-video_000000003.cmfv" />
        <SegmentURL media="https://cmaf-ham-sample-bucket.s3.amazonaws.com/output-mediaconvert/big buck bunny sampleh264-video_000000004.cmfv" />
        <SegmentURL media="https://cmaf-ham-sample-bucket.s3.amazonaws.com/output-mediaconvert/big buck bunny sampleh264-video_000000005.cmfv" />
      </SegmentList>
      <Representation id="1" width="1920" height="1080" bandwidth="2000000" codecs="avc1.640028"/>
    </AdaptationSet>
    <AdaptationSet mimeType="audio/mp4" lang="und" segmentAlignment="0">
      <SegmentList timescale="48000" duration="900000">
        <Initialization sourceURL="https://cmaf-ham-sample-bucket.s3.amazonaws.com/output-mediaconvert/big buck bunny sampleaac-audioinit.cmfa" />
        <SegmentURL media="https://cmaf-ham-sample-bucket.s3.amazonaws.com/output-mediaconvert/big buck bunny sampleaac-audio_000000001.cmfa" />
        <SegmentURL media="https://cmaf-ham-sample-bucket.s3.amazonaws.com/output-mediaconvert/big buck bunny sampleaac-audio_000000002.cmfa" />
        <SegmentURL media="https://cmaf-ham-sample-bucket.s3.amazonaws.com/output-mediaconvert/big buck bunny sampleaac-audio_000000003.cmfa" />
        <SegmentURL media="https://cmaf-ham-sample-bucket.s3.amazonaws.com/output-mediaconvert/big buck bunny sampleaac-audio_000000004.cmfa" />
        <SegmentURL media="https://cmaf-ham-sample-bucket.s3.amazonaws.com/output-mediaconvert/big buck bunny sampleaac-audio_000000005.cmfa" />
      </SegmentList>
      <Representation id="2" bandwidth="96000" audioSamplingRate="48000" codecs="mp4a.40.2">
        <AudioChannelConfiguration schemeIdUri="urn:mpeg:dash:23003:3:audio_channel_configuration:2011" value="2"/>
      </Representation>
    </AdaptationSet>
  </Period>
</MPD>`;
