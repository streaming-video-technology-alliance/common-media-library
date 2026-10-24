# Download-time model analysis

This file holds the worked example, the simulation method, and the simulation results of the [download-time model RFC](./index.md).

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
- The throughput passed to `select` comes from a local estimate in the test helper. The estimate has the half-lives of the abr README example and measures the transfer of each download, as PR 588 defines.

The runs use the two ladders of the BOLA RFC, L1 with 5 rungs and L2 with 10 rungs. The buffer cap is 18 seconds for both ladders, and a third setup runs L2 with a 30 second cap. The traces walk between 600 kbps and 9 Mbps. Each scenario runs 100 random walk traces, and each session has 75 segments.

## Scenarios

| Scenario | Time to first byte | Segment duration | Selectors | Arms |
|---|---|---|---|---|
| Low wait | 100 ms | 4 seconds | Both | Baseline, counted, ignored |
| High wait | 800 ms | 2 seconds | Both | Baseline, counted, ignored |

Each run has three arms over the same traces:

- Baseline is `@svta/cml-abr` at the head of [PR 588](https://github.com/streaming-video-technology-alliance/common-media-library/pull/588), commit `6192a767b`. That build uses the time to first byte in the starvation guard and in no pick. The comparison of the baseline and the counted arm isolates the bound.
- Counted is the proposed behavior.
- Ignored is the proposed behavior with `ignoreTimeToFirstByte: true`. The option removes the time to first byte from the pick and from the guard. The ignored arm is not the baseline, because the PR 588 guard already uses the time to first byte.

A script produced the three arms. The script loads the baseline build, the implementation build, and the simulation helper of the implementation branch.

## Metrics

- Average bitrate of the delivered segments, in bits per second.
- Stalls per session: downloads that ended after the buffer was empty.
- Switches per session: decisions whose rung differs from the previous rung.

## Expected outcome

The expectation, before the runs, has two parts. In the low wait scenario, the three metrics stay within the noise of the traces. In the high wait scenario, the stalls and the switches fall. The average bitrate falls by less than the dead-time factor suggests. The selectors of today also drop rungs after each drain. The RFC reports the measured numbers whatever the direction.

## Results

| Ladder and buffer cap | Scenario | Selector | Arm | Average Mbps | Stalls per session | Switches per session |
|---|---|---|---|---|---|---|
| 5 rungs, 18 s | Low wait, 100 ms, 4 s segments | BOLA | Baseline | 1.85 | 0.12 | 6.0 |
| 5 rungs, 18 s | Low wait, 100 ms, 4 s segments | BOLA | Counted | 1.82 | 0.12 | 5.8 |
| 5 rungs, 18 s | Low wait, 100 ms, 4 s segments | BOLA | Ignored | 1.85 | 0.12 | 6.0 |
| 5 rungs, 18 s | Low wait, 100 ms, 4 s segments | Throughput | Baseline | 1.28 | 0.03 | 5.4 |
| 5 rungs, 18 s | Low wait, 100 ms, 4 s segments | Throughput | Counted | 1.24 | 0.03 | 5.3 |
| 5 rungs, 18 s | Low wait, 100 ms, 4 s segments | Throughput | Ignored | 1.28 | 0.04 | 5.5 |
| 5 rungs, 18 s | High wait, 800 ms, 2 s segments | BOLA | Baseline | 1.38 | 0.75 | 12.7 |
| 5 rungs, 18 s | High wait, 800 ms, 2 s segments | BOLA | Counted | 0.97 | 0.07 | 2.9 |
| 5 rungs, 18 s | High wait, 800 ms, 2 s segments | BOLA | Ignored | 1.38 | 0.75 | 12.7 |
| 5 rungs, 18 s | High wait, 800 ms, 2 s segments | Throughput | Baseline | 1.20 | 0.64 | 4.8 |
| 5 rungs, 18 s | High wait, 800 ms, 2 s segments | Throughput | Counted | 0.72 | 0.00 | 2.2 |
| 5 rungs, 18 s | High wait, 800 ms, 2 s segments | Throughput | Ignored | 1.24 | 5.50 | 3.4 |
| 10 rungs, 18 s | Low wait, 100 ms, 4 s segments | BOLA | Baseline | 2.20 | 0.37 | 11.9 |
| 10 rungs, 18 s | Low wait, 100 ms, 4 s segments | BOLA | Counted | 2.16 | 0.34 | 11.3 |
| 10 rungs, 18 s | Low wait, 100 ms, 4 s segments | BOLA | Ignored | 2.21 | 0.41 | 11.9 |
| 10 rungs, 18 s | Low wait, 100 ms, 4 s segments | Throughput | Baseline | 1.62 | 0.02 | 10.5 |
| 10 rungs, 18 s | Low wait, 100 ms, 4 s segments | Throughput | Counted | 1.57 | 0.02 | 10.5 |
| 10 rungs, 18 s | Low wait, 100 ms, 4 s segments | Throughput | Ignored | 1.62 | 0.03 | 10.5 |
| 10 rungs, 18 s | High wait, 800 ms, 2 s segments | BOLA | Baseline | 1.38 | 0.87 | 18.0 |
| 10 rungs, 18 s | High wait, 800 ms, 2 s segments | BOLA | Counted | 1.12 | 0.04 | 7.4 |
| 10 rungs, 18 s | High wait, 800 ms, 2 s segments | BOLA | Ignored | 1.38 | 0.87 | 18.0 |
| 10 rungs, 18 s | High wait, 800 ms, 2 s segments | Throughput | Baseline | 1.50 | 3.93 | 11.6 |
| 10 rungs, 18 s | High wait, 800 ms, 2 s segments | Throughput | Counted | 0.87 | 0.03 | 5.0 |
| 10 rungs, 18 s | High wait, 800 ms, 2 s segments | Throughput | Ignored | 1.58 | 16.01 | 6.3 |
| 10 rungs, 30 s | Low wait, 100 ms, 4 s segments | BOLA | Baseline | 2.29 | 0.13 | 10.8 |
| 10 rungs, 30 s | Low wait, 100 ms, 4 s segments | BOLA | Counted | 2.25 | 0.11 | 10.1 |
| 10 rungs, 30 s | Low wait, 100 ms, 4 s segments | BOLA | Ignored | 2.29 | 0.16 | 10.8 |
| 10 rungs, 30 s | Low wait, 100 ms, 4 s segments | Throughput | Baseline | 1.62 | 0.02 | 10.2 |
| 10 rungs, 30 s | Low wait, 100 ms, 4 s segments | Throughput | Counted | 1.57 | 0.02 | 10.2 |
| 10 rungs, 30 s | Low wait, 100 ms, 4 s segments | Throughput | Ignored | 1.62 | 0.03 | 10.2 |
| 10 rungs, 30 s | High wait, 800 ms, 2 s segments | BOLA | Baseline | 1.43 | 0.87 | 18.4 |
| 10 rungs, 30 s | High wait, 800 ms, 2 s segments | BOLA | Counted | 1.13 | 0.04 | 7.2 |
| 10 rungs, 30 s | High wait, 800 ms, 2 s segments | BOLA | Ignored | 1.43 | 0.87 | 18.4 |
| 10 rungs, 30 s | High wait, 800 ms, 2 s segments | Throughput | Baseline | 1.50 | 3.93 | 11.6 |
| 10 rungs, 30 s | High wait, 800 ms, 2 s segments | Throughput | Counted | 0.88 | 0.03 | 4.8 |
| 10 rungs, 30 s | High wait, 800 ms, 2 s segments | Throughput | Ignored | 1.59 | 16.00 | 6.3 |

The change from the baseline to the counted arm, as ranges over the three setups:

| Scenario | Selector | Average Mbps | Stalls per session | Switches per session |
|---|---|---|---|---|
| Low wait | BOLA | -1.6 to -1.8 percent | 0.12 to 0.37 baseline, 0.11 to 0.34 counted | 6.0 to 11.9 baseline, 5.8 to 11.3 counted |
| Low wait | Throughput | -3.1 percent | 0.02 to 0.03 baseline, 0.02 to 0.03 counted | 5.4 to 10.5 baseline, 5.3 to 10.5 counted |
| High wait | BOLA | -18.8 to -29.7 percent | 0.75 to 0.87 baseline, 0.04 to 0.07 counted | 12.7 to 18.4 baseline, 2.9 to 7.4 counted |
| High wait | Throughput | -40.0 to -42.0 percent | 0.64 to 3.93 baseline, 0.00 to 0.03 counted | 4.8 to 11.6 baseline, 2.2 to 5.0 counted |

In the low wait scenario, the bitrate falls in all six comparisons, and stalls and switches never rise. The table holds averages only. The table therefore neither confirms nor refutes the expectation that the low wait metrics stay within the noise. In the high wait scenario, stalls and switches fall for both selectors, as expected. BOLA loses less bitrate than the dead-time factor suggests, as expected. The throughput selector loses about the bitrate that the factor suggests, and not less. That result contradicts the Expected outcome section.

The baseline and the ignored arm differ for the throughput selector in the high wait scenario. The guard term of PR 588 removes most stalls of the ignored arm. The term also nearly doubles the switches. The guard lowers the pick at a low buffer, and the pick climbs when the buffer refills. This is the cycle that the Motivation section of the RFC describes. The bound removes the remaining stalls of the baseline and about halves its switches. For BOLA, the baseline and the ignored arm agree to two decimals in every row. The guard term changed the decisions in 37 of the 600 BOLA sessions and no aggregate.
