import type { ResourceTiming } from '@svta/cml-utils'
import { getBandwidthBps } from '@svta/cml-utils'
import type { ThroughputEstimator } from './ThroughputEstimator.ts'

/**
 * Harmonic Mean throughput estimator
 *
 *
 * @beta
 */
export class HarmonicMeanEstimator implements ThroughputEstimator {
	private samples: ResourceTiming[] = []

	public sample(sample: ResourceTiming): void {
		this.samples.push(sample)
	}

	public getEstimate(): number {
		let value: number = 0

		for (const sample of this.samples) {
			value += 1 / getBandwidthBps(sample)
		}

		return this.samples.length / value
	}
}
