export const mpdSample8: string = `<?xml version="1.0" encoding="utf-8"?>
<!--Single content continuing at the period boundary.-->
<MPD xmlns="urn:mpeg:dash:schema:mpd:2011" minBufferTime="PT1.500000S" type="static" mediaPresentationDuration="PT0H9M54.00S" profiles="urn:mpeg:dash:profile:isoff-live:2011,http://dashif.org/guidelines/dash264" xmlns:xlink="http://www.w3.org/1999/xlink">
  <Period id="0" duration="PT250S">
    <AdaptationSet segmentAlignment="true" maxWidth="1280" maxHeight="720" maxFrameRate="24" par="16:9">
      <Representation id="1" mimeType="video/mp4" codecs="avc1.4d401f" width="1280" height="720" frameRate="24" sar="1:1" startWithSAP="1" bandwidth="980104">
        <SegmentTemplate timescale="12288" presentationTimeOffset="1024" duration="24576" media="https://dash.akamaized.net/dash264/TestCases/5a/nomor/BBB_720_1M_video_$Number$.mp4" startNumber="1" initialization="https://dash.akamaized.net/dash264/TestCases/5a/nomor/BBB_720_1M_video_init.mp4" />
      </Representation>
      <Representation id="2" mimeType="video/mp4" codecs="avc1.4d401f" width="1280" height="720" frameRate="24" sar="1:1" startWithSAP="1" bandwidth="1950145">
        <SegmentTemplate timescale="12288" presentationTimeOffset="1024" duration="24576" media="https://dash.akamaized.net/dash264/TestCases/5a/nomor/BBB_720_2M_video_$Number$.mp4" startNumber="1" initialization="https://dash.akamaized.net/dash264/TestCases/5a/nomor/BBB_720_2M_video_init.mp4"></SegmentTemplate>
      </Representation>
      <Representation id="3" mimeType="video/mp4" codecs="avc1.4d401f" width="1280" height="720" frameRate="24" sar="1:1" startWithSAP="1" bandwidth="3893089">
        <SegmentTemplate timescale="12288" presentationTimeOffset="1024" duration="24576" media="https://dash.akamaized.net/dash264/TestCases/5a/nomor/BBB_720_4M_video_$Number$.mp4" startNumber="1" initialization="https://dash.akamaized.net/dash264/TestCases/5a/nomor/BBB_720_4M_video_init.mp4" />
      </Representation>
    </AdaptationSet>
    <AdaptationSet segmentAlignment="true">
      <Representation id="4" mimeType="audio/mp4" codecs="mp4a.40.29" audioSamplingRate="48000" startWithSAP="1" bandwidth="33434">
        <AudioChannelConfiguration schemeIdUri="urn:mpeg:dash:23003:3:audio_channel_configuration:2011" value="2" />
        <SegmentTemplate timescale="48000" duration="94175" media="https://dash.akamaized.net/dash264/TestCases/5a/nomor/BBB_32k_$Number$.mp4" startNumber="1" initialization="https://dash.akamaized.net/dash264/TestCases/5a/nomor/BBB_32k_init.mp4" />
      </Representation>
    </AdaptationSet>
  </Period>
  <Period id="1" duration="PT344S">
    <AdaptationSet segmentAlignment="true" maxWidth="1280" maxHeight="720" maxFrameRate="24" par="16:9">
      <Representation id="1" mimeType="video/mp4" codecs="avc1.4d401f" width="1280" height="720" frameRate="24" sar="1:1" startWithSAP="1" bandwidth="980104">
        <SegmentTemplate timescale="12288" presentationTimeOffset="3073024" duration="24576" media="https://dash.akamaized.net/dash264/TestCases/5a/nomor/BBB_720_1M_video_$Number$.mp4" startNumber="126" initialization="https://dash.akamaized.net/dash264/TestCases/5a/nomor/BBB_720_1M_video_init.mp4" />
      </Representation>
      <Representation id="2" mimeType="video/mp4" codecs="avc1.4d401f" width="1280" height="720" frameRate="24" sar="1:1" startWithSAP="1" bandwidth="1950145">
        <SegmentTemplate timescale="12288" presentationTimeOffset="3073024" duration="24576" media="https://dash.akamaized.net/dash264/TestCases/5a/nomor/BBB_720_2M_video_$Number$.mp4" startNumber="126" initialization="https://dash.akamaized.net/dash264/TestCases/5a/nomor/BBB_720_2M_video_init.mp4" />
      </Representation>
      <Representation id="3" mimeType="video/mp4" codecs="avc1.4d401f" width="1280" height="720" frameRate="24" sar="1:1" startWithSAP="1" bandwidth="3893089">
        <SegmentTemplate timescale="12288" presentationTimeOffset="3073024" duration="24576" media="https://dash.akamaized.net/dash264/TestCases/5a/nomor/BBB_720_4M_video_$Number$.mp4" startNumber="126" initialization="https://dash.akamaized.net/dash264/TestCases/5a/nomor/BBB_720_4M_video_init.mp4" />
      </Representation>
    </AdaptationSet>
    <AdaptationSet segmentAlignment="true">
      <Representation id="4" mimeType="audio/mp4" codecs="mp4a.40.29" audioSamplingRate="48000" startWithSAP="1" bandwidth="33434">
        <AudioChannelConfiguration schemeIdUri="urn:mpeg:dash:23003:3:audio_channel_configuration:2011" value="2" />
        <SegmentTemplate timescale="48000" presentationTimeOffset="12000000" duration="94175" media="https://dash.akamaized.net/dash264/TestCases/5a/nomor/BBB_32k_$Number$.mp4" startNumber="128" initialization="https://dash.akamaized.net/dash264/TestCases/5a/nomor/BBB_32k_init.mp4" />
      </Representation>
    </AdaptationSet>
  </Period>
</MPD>`;
