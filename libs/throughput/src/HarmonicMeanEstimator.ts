import type { ResourceTiming } from '@svta/cml-utils';
import { getBandwidthBps } from '@svta/cml-utils';
import type { ThroughputEstimator } from './ThroughputEstimator.js';

/**
 * Harmonic Mean throughput estimator
 *
 *
 * @beta
 */
export class HarmonicMeanEstimator implements ThroughputEstimator {
	private samples: ResourceTiming[] = [];

	public sample(sample: ResourceTiming): void {
		this.samples.push(sample);
	}

	public getEstimate(): number {
		let value: number = 0;

		for (let i = 0; i < this.samples.length; i++) {
			value += 1 / getBandwidthBps(this.samples[i]);
		}

		return this.samples.length / value;
	}
}
