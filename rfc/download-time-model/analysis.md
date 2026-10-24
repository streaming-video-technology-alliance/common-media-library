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
- The throughput passed to `select` comes from a local estimate with the half-lives of the README example, fed with the transfer of each download. The estimate measures the transfer, as PR 588 defines.

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

| Ladder and buffer cap | Scenario | Selector | Time to first byte | Average Mbps | Stalls per session | Switches per session |
|---|---|---|---|---|---|---|
| 5 rungs, 18 s | Low wait, 100 ms, 4 s segments | BOLA | Counted | 1.82 | 0.12 | 5.8 |
| 5 rungs, 18 s | Low wait, 100 ms, 4 s segments | BOLA | Ignored | 1.85 | 0.12 | 6.0 |
| 5 rungs, 18 s | Low wait, 100 ms, 4 s segments | Throughput | Counted | 1.24 | 0.03 | 5.3 |
| 5 rungs, 18 s | Low wait, 100 ms, 4 s segments | Throughput | Ignored | 1.28 | 0.04 | 5.5 |
| 5 rungs, 18 s | High wait, 800 ms, 2 s segments | BOLA | Counted | 0.97 | 0.07 | 2.9 |
| 5 rungs, 18 s | High wait, 800 ms, 2 s segments | BOLA | Ignored | 1.38 | 0.75 | 12.7 |
| 5 rungs, 18 s | High wait, 800 ms, 2 s segments | Throughput | Counted | 0.72 | 0.00 | 2.2 |
| 5 rungs, 18 s | High wait, 800 ms, 2 s segments | Throughput | Ignored | 1.24 | 5.50 | 3.4 |
| 10 rungs, 18 s | Low wait, 100 ms, 4 s segments | BOLA | Counted | 2.16 | 0.34 | 11.3 |
| 10 rungs, 18 s | Low wait, 100 ms, 4 s segments | BOLA | Ignored | 2.21 | 0.41 | 11.9 |
| 10 rungs, 18 s | Low wait, 100 ms, 4 s segments | Throughput | Counted | 1.57 | 0.02 | 10.5 |
| 10 rungs, 18 s | Low wait, 100 ms, 4 s segments | Throughput | Ignored | 1.62 | 0.03 | 10.5 |
| 10 rungs, 18 s | High wait, 800 ms, 2 s segments | BOLA | Counted | 1.12 | 0.04 | 7.4 |
| 10 rungs, 18 s | High wait, 800 ms, 2 s segments | BOLA | Ignored | 1.38 | 0.87 | 18.0 |
| 10 rungs, 18 s | High wait, 800 ms, 2 s segments | Throughput | Counted | 0.87 | 0.03 | 5.0 |
| 10 rungs, 18 s | High wait, 800 ms, 2 s segments | Throughput | Ignored | 1.58 | 16.01 | 6.3 |
| 10 rungs, 30 s | Low wait, 100 ms, 4 s segments | BOLA | Counted | 2.25 | 0.11 | 10.1 |
| 10 rungs, 30 s | Low wait, 100 ms, 4 s segments | BOLA | Ignored | 2.29 | 0.16 | 10.8 |
| 10 rungs, 30 s | Low wait, 100 ms, 4 s segments | Throughput | Counted | 1.57 | 0.02 | 10.2 |
| 10 rungs, 30 s | Low wait, 100 ms, 4 s segments | Throughput | Ignored | 1.62 | 0.03 | 10.2 |
| 10 rungs, 30 s | High wait, 800 ms, 2 s segments | BOLA | Counted | 1.13 | 0.04 | 7.2 |
| 10 rungs, 30 s | High wait, 800 ms, 2 s segments | BOLA | Ignored | 1.43 | 0.87 | 18.4 |
| 10 rungs, 30 s | High wait, 800 ms, 2 s segments | Throughput | Counted | 0.88 | 0.03 | 4.8 |
| 10 rungs, 30 s | High wait, 800 ms, 2 s segments | Throughput | Ignored | 1.59 | 16.00 | 6.3 |

Counted means the option `ignoreTimeToFirstByte` is off. Ignored means the option is on, which gives the picks of today. In the low wait scenario, counting the time to first byte lowers the average bitrate in all six comparisons. The fall is about 2 to 3 percent. Counting changes the stalls by at most 0.07 per session. It changes the switches by at most 0.7 per session. Counting never raises the stalls or the switches. The table holds averages only. It does not show whether these differences are within the noise of the traces. In the high wait scenario, counting the time to first byte lowers the stalls and the switches. This holds in all six comparisons. With the option on, BOLA has 0.75 to 0.87 stalls per session. With the option off, it has 0.04 to 0.07. With the option on, the throughput selector has 5.50 to 16.01 stalls per session. With the option off, it has 0.00 to 0.03. The switches per session fall by 9.8 to 11.2 for BOLA. They fall by 1.2 to 1.5 for the throughput selector. The average bitrate also falls. For BOLA, the fall is about 30, 19, and 21 percent in the three setups. For the throughput selector, the fall is about 42, 45, and 45 percent. The Expected outcome section says the bitrate falls by less than the dead-time factor suggests. The factor of 0.6 suggests a fall of 40 percent. The BOLA numbers match this statement. The throughput selector does not match, because its bitrate falls by more than 40 percent.
