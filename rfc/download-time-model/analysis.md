# Download-time model analysis

This file holds the worked example and the simulation plan of the [download-time model RFC](./index.md). The implementation PR adds the simulation results.

## Worked example

The numbers come from [issue 587](https://github.com/streaming-video-technology-alliance/common-media-library/issues/587). The device is an LG webOS 22 TV on a live DASH stream with 2 second segments. The time to first byte is 800 ms, and the link is 14 Mbps.

| Quantity | Value |
|---|---|
| Safe throughput, `14 * 0.9` | 12.6 Mbps |
| Pick without the bound | Highest rung at or below 12.6 Mbps |
| Download of a 2 second segment at 12.6 Mbps, `0.8 + 25.2 / 14` | 2.6 seconds |
| Buffer lost per segment at that rung | 0.6 seconds |
| Dead-time factor, `1 - 0.8 / 2` | 0.6 |
| Pick with the bound | Highest rung at or below 7.56 Mbps |
| Download of a 2 second segment at 7.56 Mbps, `0.8 + 15.12 / 14` | 1.88 seconds |

At 100 ms and 6 second segments the factor is 0.983, and the bound sits inside the safety factor.

## Simulation method

The seeded playback simulation of the abr tests, `simulatePlayback`, runs a player against a throughput trace. The player downloads one segment at a time. The player asks the selector before each download and reports each finished download with `sample`. The implementation extends the simulation with one parameter, the time to first byte in seconds per download.

- The wall-clock time of a download is the time to first byte plus the bytes over the trace throughput.
- The timing of the sample gets `responseStart` at the start time plus the time to first byte. The selector then measures the same wait the player paid.
- The throughput passed to `select` comes from an `EwmaEstimator` fed with the same timings. The estimate measures the transfer, as PR 588 defines.

The runs use the two ladders of the BOLA RFC, L1 with 5 rungs and L2 with 10 rungs. Each scenario runs 100 random walk traces, and each session has 75 segments.

## Scenarios

| Scenario | Time to first byte | Segment duration | Selectors | Option |
|---|---|---|---|---|
| Low wait | 100 ms | 4 seconds | Both | Off and on |
| High wait | 800 ms | 2 seconds | Both | Off and on |

The option off is the proposed behavior. The option on, `ignoreTimeToFirstByte: true`, gives the picks of today for the same traces, so the comparison isolates the bound.

## Metrics

- Average bitrate of the delivered segments, in bits per second.
- Stalls per session: downloads that ended after the buffer was empty.
- Switches per session: decisions whose rung differs from the previous rung.

## Expected outcome

The expectation, before the runs, has two parts. In the low wait scenario, the three metrics stay within the noise of the traces. In the high wait scenario, the stalls and the switches fall. The average bitrate falls by less than the dead-time factor suggests. The selectors of today also drop rungs after each drain. The RFC reports the measured numbers whatever the direction.

## Results

The implementation branch produces the results. This section receives the tables before the RFC PR opens.
