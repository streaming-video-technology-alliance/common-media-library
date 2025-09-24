import type { ResourceTiming } from '@svta/cml-utils/ResourceTiming.js';
import { getBandwidthBps } from '@svta/cml-utils/getBandwidthBps.js';
import type { ThroughputEstimator } from './ThroughputEstimator.js';

/**
 * Zero-Lag Exponential Moving Average (ZLEMA) throughput estimator
 *
 * @group Throughput
 *
 * @beta
 */
export class ZlemaEstimator implements ThroughputEstimator {
	private samples: ResourceTiming[] = [];

	public sample(sample: ResourceTiming): void {
		this.samples.push(sample);
	}

	public getEstimate(): number {
		if (this.samples.length === 0) {
			return NaN;
		}

		const alpha = 2 / (this.samples.length + 1);

		let ema: number, zlema: number;

		ema = zlema = getBandwidthBps(this.samples[this.samples.length - 1]);

		for (let i = 0; i < this.samples.length; i++) {
			ema = alpha * getBandwidthBps(this.samples[i]) + (1 - alpha) * ema;
			zlema = alpha * ema + (1 - alpha) * zlema;
		}

		return zlema;
	}
}
