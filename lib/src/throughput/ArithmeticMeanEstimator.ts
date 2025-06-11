import type { ResourceTiming } from '../request/ResourceTiming.js';
import { getBandwidthBps } from '../utils/getBandwidthBps.js';
import type { ThroughputEstimator } from './ThroughputEstimator.js';

/**
 * Arithmetic Mean throughput estimator
 *
 * @group Throughput
 *
 * @beta
 */
export class ArithmeticMeanEstimator implements ThroughputEstimator {
	private samples: ResourceTiming[] = [];

	public sample(sample: ResourceTiming): void {
		this.samples.push(sample);
	}

	public getEstimate(): number {
		let value: number = 0;

		for (let i = 0; i < this.samples.length; i++) {
			value += getBandwidthBps(this.samples[i]);
		}

		return value / this.samples.length;
	}
}
