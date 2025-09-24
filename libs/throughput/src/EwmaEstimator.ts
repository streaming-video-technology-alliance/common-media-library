import type { ResourceTiming } from '@svta/cml-utils/ResourceTiming.js';
import { getBandwidthBps } from '@svta/cml-utils/getBandwidthBps.js';
import { Ewma } from './Ewma.js';
import type { EwmaEstimatorOptions } from './EwmaEstimatorOptions.js';
import type { ThroughputEstimator } from './ThroughputEstimator.js';

/**
 * Exponential Weighted Moving Average (EWMA) throughput estimator based on 2 half-lives
 *
 * @group Throughput
 *
 * @beta
 */
export class EwmaEstimator implements ThroughputEstimator {
	private fastEwma: Ewma;
	private slowEwma: Ewma;

	public constructor(options: EwmaEstimatorOptions) {
		this.slowEwma = new Ewma(options.slowHalfLife);
		this.fastEwma = new Ewma(options.fastHalfLife);
	}

	public sample(sample: ResourceTiming): void {
		// TODO: shaka
		// 1. If `sample.encodedBodySize` is less than `this.minBytes_`, don't do anything
		// TODO: dash.js
		// 1. If `sample.encodedBodySize` is NaN or Infinity, don't do anything
		// TODO: hls.js
		// 1. If `durationSeconds` is less than `this.minDelayMs_`, make it `this.minDelayMs_` (default is 50ms)
		const durationSeconds = sample.duration / 1000;
		const bandwidthBps = getBandwidthBps(sample);

		this.slowEwma.sample(durationSeconds, bandwidthBps);
		this.fastEwma.sample(durationSeconds, bandwidthBps);
	}

	public getEstimate(): number {
		// TODO: shaka
		// 1. Returns `defaultEstimate` for this.totalBytes < `options.minTotalBytes`
		// 1.1. Returns `options.defaultBandwidthEstimate`
		// 1.2. or `navigator.connection.downlink * 1e6` if available
		// TODO: dash.js
		// 1. Returns `NaN` for this.totalDuration <= 0
		// 2. `Math.max` for latency calculation
		// TODO: hls.js
		// 1. Returns `defaultEstimate` for this.totalDuration < `this.minDuration`
		// 1.1. Returns `config.abrEwmaDefaultEstimate` (default: 500 kbps)
		return Math.min(this.fastEwma.getEstimate(), this.slowEwma.getEstimate());
	}

	public canEstimate(): boolean {
		// TODO: shaka, `this.totalBytes >= options.minTotalBytes`
		// TODO: hls.js, `this.totalDuration >= this.minDuration`

		return true;
	}
}
