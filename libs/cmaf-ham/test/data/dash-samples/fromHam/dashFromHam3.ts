export const dashFromHam3 = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<MPD mediaPresentationDuration="PT12M14S" type="static">
  <Period duration="PT12M14S" id="presentation-id-734" start="PT0S">
    <AdaptationSet id="1" group="1" contentType="audio" mimeType="audio/mp4" lang="en" codecs="mp4a.40.2">
      <Representation id="audio_eng=64349" bandwidth="64349" mimeType="audio/mp4" audioSamplingRate="48000" codecs="mp4a.40.2">
        <SegmentBase indexRange="704-2211" timescale="48000">
          <Initialization range="0-703"/>
        </SegmentBase>
        <AudioChannelConfiguration schemeIdUri="urn:mpeg:dash:23003:3:audio_channel_configuration:2011" value="2"/>
        <BaseURL>https://dash.akamaized.net/dash264/TestCasesIOP41/CMAF/UnifiedStreaming/tears-of-steel-aac-64k.cmfa</BaseURL>
      </Representation>
      <Representation id="audio_eng=128407" bandwidth="128407" mimeType="audio/mp4" audioSamplingRate="48000" codecs="mp4a.40.2">
        <SegmentBase indexRange="704-2211" timescale="48000">
          <Initialization range="0-703"/>
        </SegmentBase>
        <AudioChannelConfiguration schemeIdUri="urn:mpeg:dash:23003:3:audio_channel_configuration:2011" value="2"/>
        <BaseURL>https://dash.akamaized.net/dash264/TestCasesIOP41/CMAF/UnifiedStreaming/tears-of-steel-aac-128k.cmfa</BaseURL>
      </Representation>
    </AdaptationSet>
    <AdaptationSet id="12" group="2" contentType="video" mimeType="video/mp4" frameRate="24" lang="en" codecs="hev1.1.6.H150.90">
      <Representation id="video_eng=1032000" bandwidth="1032000" mimeType="video/mp4" frameRate="24" width="1680" height="750" codecs="hev1.1.6.H150.90" scanType="progressive">
        <SegmentBase indexRange="2901-4036">
          <Initialization range="0-2900"/>
        </SegmentBase>
        <BaseURL>https://dash.akamaized.net/dash264/TestCasesIOP41/CMAF/UnifiedStreaming/tears-of-steel-hev1-1100k.cmfv</BaseURL>
      </Representation>
      <Representation id="video_eng=1250000" bandwidth="1250000" mimeType="video/mp4" frameRate="24" width="2576" height="1150" codecs="hev1.1.6.H150.90" scanType="progressive">
        <SegmentBase indexRange="2901-4036">
          <Initialization range="0-2900"/>
        </SegmentBase>
        <BaseURL>https://dash.akamaized.net/dash264/TestCasesIOP41/CMAF/UnifiedStreaming/tears-of-steel-hev1-1500k.cmfv</BaseURL>
      </Representation>
      <Representation id="video_eng=1600000" bandwidth="1600000" mimeType="video/mp4" frameRate="24" width="3360" height="1500" codecs="hev1.1.6.H150.90" scanType="progressive">
        <SegmentBase indexRange="2901-4036">
          <Initialization range="0-2900"/>
        </SegmentBase>
        <BaseURL>https://dash.akamaized.net/dash264/TestCasesIOP41/CMAF/UnifiedStreaming/tears-of-steel-hev1-2200k.cmfv</BaseURL>
      </Representation>
    </AdaptationSet>
    <AdaptationSet id="2" group="3" contentType="text" mimeType="text/mp4" lang="en" codecs="wvtt">
      <Representation id="textstream_eng=1000" bandwidth="1000" mimeType="text/mp4">
        <SegmentBase indexRange="607-1778">
          <Initialization range="0-606"/>
        </SegmentBase>
        <BaseURL>https://dash.akamaized.net/dash264/TestCasesIOP41/CMAF/UnifiedStreaming/tears-of-steel-en.cmft</BaseURL>
      </Representation>
    </AdaptationSet>
    <AdaptationSet id="4" group="3" contentType="text" mimeType="text/mp4" lang="es" codecs="wvtt">
      <Representation id="textstream_spa=1000" bandwidth="1000" mimeType="text/mp4">
        <SegmentBase indexRange="607-1778">
          <Initialization range="0-606"/>
        </SegmentBase>
        <BaseURL>https://dash.akamaized.net/dash264/TestCasesIOP41/CMAF/UnifiedStreaming/tears-of-steel-es.cmft</BaseURL>
      </Representation>
    </AdaptationSet>
  </Period>
</MPD>`
