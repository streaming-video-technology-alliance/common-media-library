import type { ResourceTiming } from '../request/ResourceTiming.js';
import type { ThroughputEstimator } from './ThroughputEstimator.js';

/**
 * Harmonic Mean throughput estimator
 *
 * @group Throughput
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
			const sample = this.samples[i];
			const durationSeconds = sample.duration / 1000;
			const bandwidthBps = sample.encodedBodySize * 8 / durationSeconds;

			value += 1 / bandwidthBps;
		}

		return this.samples.length / value;
	}
}
