# BOLA analysis

This record supports the [RFC](../../rfc/bola-abr-selector.md). It explains BOLA, lists the benefits and the costs, and records what the dash.js reference does. The RFC holds the formulas and the API. This record holds the evidence.

## What BOLA does

### The problem

A video has several rungs. Each rung is an encoding at one bitrate, and the set of rungs is the bitrate ladder. Before every segment request, the player picks one rung. A rung that is too high freezes playback. A rung that is too low looks bad.

Most players estimate the throughput from past downloads and pick the rung that fits. The estimate is noisy and lags behind sudden drops. The quality oscillates when the estimate sits between two rungs.

### The idea

BOLA is the Buffer Occupancy based Lyapunov Algorithm. [Spiteri, Urgaonkar, and Sitaraman](https://arxiv.org/abs/1601.06748) defined it. BOLA decides from the buffer level only. The buffer level already summarizes what the network did in the past. A fuller buffer can pay for a higher rung.

The authors write the choice as an optimization. It maximizes utility and smoothness while it keeps the buffer from running empty. Lyapunov optimization solves it. The result is a set of buffer thresholds. Each threshold marks the buffer level where the next higher rung becomes the best choice.

Two parameters control the thresholds. `V` sets the distance between them. `gamma` shifts all of them to the right. A larger `gamma` makes the player more careful, because it needs more buffer before each upward switch. The RFC derives both from the ladder and the buffer target.

### Example

The example uses a ladder of 400, 800, 1600, and 3200 kbps. The table shows the rung that BOLA picks for each buffer level. The buffer target changes the thresholds.

| Buffer target | Thresholds | 5 s | 8 s | 12 s | 20 s | 30 s |
|---|---|---|---|---|---|---|
| 18 s | 7.3 s, 10.0 s, 12.7 s | 400 | 800 | 1600 | 3200 | 3200 |
| 30 s | 3.3 s, 10.0 s, 16.7 s | 800 | 800 | 1600 | 3200 | 3200 |

### Parts that make BOLA usable

Plain BOLA starts at the lowest rung and climbs slowly, because the buffer is empty. dash.js adds three parts:

- **Placeholder buffer.** This is virtual buffer time that BOLA adds to the real buffer level. At startup and after a seek, it lets BOLA begin at the rung that the throughput sustains. A follow-up paper on dash.js reports a median of 21.3 s to reach the top rung at startup without it. With it, the median is 9.3 s.
- **Oscillation guard (BOLA-O).** This part limits upward switches to the rung that the throughput sustains. It never forces a downward switch.
- **Download delay.** When the buffer is above the maximum level of the chosen rung, BOLA asks the player to wait. This avoids overfilling the buffer with low rungs.

The paper defines more variants: BOLA-BASIC, BOLA-FINITE, BOLA-U, and BOLA-O. dash.js implements the placeholder buffer from the follow-up paper and the BOLA-O logic.

## Benefits

### Evidence from the literature

| Source | Finding |
|---|---|
| [BOLA paper](https://arxiv.org/abs/1601.06748) | BOLA reaches 84% to 95% of the offline optimal utility. It matches or beats ELASTIC, PANDA, MPC, and Pensieve on utility in the authors' tests. |
| [dash.js follow-up paper](https://people.cs.umass.edu/~ramesh/Site/PUBLICATIONS_files/abr-dashjs.pdf) | With a 25 s buffer on 40 4G traces, the median bitrate of BOLA is 19% above the throughput rule. It also oscillates less. |
| The same paper | With a 10 s buffer, the throughput rule and the dynamic strategy beat BOLA on oscillation. |

BOLA does not need an accurate throughput estimate in the steady state. It also works where a player has no HTTP timings. A shaka-player feature request for MoQ streams says that bandwidth estimation does not apply to data delivered over QUIC.

Today only dash.js ships BOLA. A review of the hls.js and shaka-player sources found no BOLA. Both use throughput estimates with exponentially weighted averages.

### What a simplified simulation shows

A scratch simulation compared the BOLA design with a simple rate-based baseline. The baseline is a pair of exponentially weighted averages with half-lives of 3 s and 8 s, and a safety factor of 0.9. The simulation is deterministic and uses 200 seeded sessions of 75 segments of 4 s. The channel is a random walk of the throughput between 0.6 Mbps and 9 Mbps.

The simulation uses two ladders. L1 has 5 rungs from 300 kbps to 6 Mbps. L2 has 10 rungs from 235 kbps to 5.8 Mbps. The cap is the buffer size of the player. `B` is the effective buffer time that the selector derives from the ladder and the buffer target. The RFC defines it. The simulation passes the cap as the buffer target, so `B` is 20 s for L1 and 30 s for L2.

| Setup | Variant | Average Mbps | Stalls per session | Switches per session |
|---|---|---|---|---|
| L1, cap 18 s | Rate-based baseline | 2.36 | 1.53 | 16.0 |
| L1, cap 18 s | BOLA | 2.62 | 1.17 | 10.5 |
| L1, cap 18 s | BOLA without oscillation guard | 3.04 | 1.29 | 32.0 |
| L1, cap 18 s | BOLA without placeholder | 1.87 | 0.00 | 7.4 |
| L1, cap 18 s | BOLA with real-buffer guard | 2.60 | 1.09 | 11.2 |
| L2, cap 18 s | Rate-based baseline | 2.64 | 2.28 | 26.3 |
| L2, cap 18 s | BOLA | 2.74 | 1.92 | 19.5 |
| L2, cap 18 s | BOLA without oscillation guard | 2.87 | 1.66 | 32.2 |
| L2, cap 18 s | BOLA without placeholder | 0.95 | 0.00 | 6.0 |
| L2, cap 18 s | BOLA with real-buffer guard | 2.68 | 1.26 | 19.8 |
| L2, cap 30 s | Rate-based baseline | 2.66 | 2.15 | 25.7 |
| L2, cap 30 s | BOLA | 2.84 | 1.00 | 16.8 |
| L2, cap 30 s | BOLA without oscillation guard | 3.00 | 1.00 | 31.1 |
| L2, cap 30 s | BOLA without placeholder | 2.74 | 0.00 | 16.3 |
| L2, cap 30 s | BOLA with real-buffer guard | 2.83 | 1.00 | 17.0 |

The real-buffer guard ignores the placeholder while the real buffer is below two segments.

A second, harsher channel gave the same direction for findings 1 and 2. That channel picks a new level between 0.6 Mbps and 9 Mbps every 5 s to 20 s. In that channel, BOLA stalls 51% to 78% less than the baseline. Its average bitrate is 3% to 17% lower.

The simulation supports three findings:

1. **The placeholder buffer is required when the player cap is below `B`.** Without it, the average bitrate falls by 29% for L1 and by 65% for L2 at a cap of 18 s. The real buffer never reaches the thresholds of the upper rungs.
2. **The oscillation guard (BOLA-O) cuts switches by 1.6 to 3 times.** It costs 4% to 14% of the average bitrate.
3. **BOLA with the oscillation guard and the placeholder stalls less than the baseline in every setup of both channels.** The advantage in the average bitrate depends on the channel.

The simulation also shows two limits:

- When the cap is at or above `B`, the placeholder adds about 4% of bitrate and about one stall per session. Its value there is a faster startup and seek, which this model does not measure.
- The real-buffer guard reduces stalls by 26% to 34% in the L2 cap 18 s setup. It costs under 4% of the bitrate.

These results come from a simplified model. The model has no packet-level effects, no variable segment sizes, and a simple baseline. The stall comparison depends on the channel and on the baseline. The literature above is the stronger evidence. The implementation will include a seeded simulation test that asserts only the invariants and the structural findings.

## Costs and risks

- BOLA suits large buffers. In the follow-up paper, a throughput rule oscillates less than BOLA with a 10 s buffer. Low-latency streams often have such a small buffer. The dash.js player runs BOLA only above a buffer level and uses a throughput rule below it.
- BOLA keeps state. The player must forward the segment, stall, seek, and abandon events.
- The pure core is small. Most of `BolaRule.js` handles player wiring. That part is where the tuning decisions and the defects live.
- The behavior can drift from dash.js. The RFC lists the deliberate differences. A manual comparison with the real dash.js rule covers the rest.
- The port derives from BSD-3 code. The package needs a `NOTICE.md` entry and an entry in the root `NOTICE` file.

## The dash.js reference

The reference is `BolaRule.js`. The issue pins dash.js commit `ac9e3d1` of 2026-04-26. The file is identical in the dash.js `development` branch as of 2026-09-24, so this analysis applies to both versions. The analysis also covers the wiring in `ABRRulesCollection`, `AbrController`, and `ThroughputController`.

### What the rule does

The rule keeps one state record for each stream and media type. The state is one of three values: one bitrate, startup, or steady.

- **One bitrate.** The ladder has a single distinct rung. The rule makes no decision.
- **Startup.** The rule picks the highest rung at or below the safe throughput. The safe throughput is the average throughput times a safety factor of 0.9. The rule sets the placeholder buffer to the threshold of that rung minus the real buffer. It moves to steady after one segment loaded and the buffer holds at least one segment.
- **Steady.** The rule adds the elapsed wall-clock time to the placeholder, scores the rungs, applies BOLA-O, and computes the delay.

The rule mutates its state when a segment loads or when a request metric arrives. It also mutates its state on a seek, a buffer-empty event, a quality change request, and an abandoned download. A change of the minimum bitrate, the maximum bitrate, or the video element size resets it.

dash.js combines BOLA with a throughput rule. The default strategy runs the throughput rule first. It switches to BOLA when the buffer reaches a threshold. It switches back when the buffer falls below half of that threshold. The commit of the issue used the default buffer time as the threshold, which is 18 s. The `development` branch uses the new setting `hybridSwitchBufferTime`, which is 12 s by default. A separate rule lowers the rung when the real buffer is small.

### What CML ports and what stays in the player

| CML ports (pure logic) | The player keeps |
|---|---|
| Utilities, `V`, `gamma`, and the score maximum | Event subscriptions |
| The startup and steady state machine | Settings, metrics, and the rules context |
| The placeholder buffer, BOLA-O, and the delay | Ladder filtering, CMSD limits, and DRM filtering |
| The rescale after a buffer target change | The combination of BOLA with other rules |

### Defects found in the reference

The first defect was verified with an independent script. The others come from reading the code.

1. The minimum and maximum buffer helpers omit the utility offset that the score uses. They differ from the real switch points by exactly `V`. Take the ladder of 300 kbps, 750 kbps, 1.5 Mbps, 3 Mbps, and 6 Mbps with a target of 18 s. The real switch point to the second rung is 7.96 s. The helper reports 11.30 s. This skews the startup placeholder, the abandon cap, and the delay.
2. The helpers index by the position in the unfiltered ladder. The state arrays use the position in the filtered ladder. A minimum bitrate or a DRM filter can produce an undefined value and a `NaN` delay.
3. The buffer-empty handler is inverted for audio and resets all media types when video stalls.
4. A ladder that is not ascending breaks the derivation of the parameters.
5. An unknown throughput in the steady state makes BOLA-O block every upward switch.
6. The rule reads `Date.now()`, so tests cannot control the time.
7. The rule builds its state once for each stream and media type. It resets on a new Period, on a new media info, and on a change of the minimum or maximum bitrate. It also resets on a resize when portal limiting is on. It does not detect a change of the ladder inside a Period.

## Other ABR approaches

| Approach | Inputs | Needs a throughput estimate | Known weakness |
|---|---|---|---|
| Exponentially weighted throughput (hls.js, shaka-player, dash.js) | Past download timings | Yes | Noisy and slow to react to drops |
| [BBA](https://dl.acm.org/doi/10.1145/2740070.2626296) | Buffer level | At startup only | Assumes a buffer of minutes |
| BOLA | Buffer level, plus throughput at startup and as a cap | Not in the steady state | Slow startup and a poor fit for small buffers |
| [MPC](https://dl.acm.org/doi/10.1145/2785956.2787486) | Predicted throughput, buffer level, and a search horizon | Yes, and accuracy matters | Sensitive to prediction errors |
| [Pensieve](https://dl.acm.org/doi/10.1145/3098822.3098843) | A learned model | Implicit | Depends on its training data |

## Where ABR fits in CML

`SCOPING.md` lists standards-based media player features and excludes a working media player. It does not mention ABR. The `@svta/cml-throughput` package already ships estimators, so the scope moved past that document. A pure selector with no player code stays inside the exclusion.

Issue 116 produced the throughput estimators. Issue 115, "Create a common ABR framework", was closed on 2026-09-29 with no linked pull request. Issue 358 asked for BOLA.

## Testing

The [steps](steps.md) hold the test strategy.
