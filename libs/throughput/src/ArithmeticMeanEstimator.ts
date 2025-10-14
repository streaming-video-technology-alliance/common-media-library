import type { ResourceTiming } from '@svta/cml-utils'
import { getBandwidthBps } from '@svta/cml-utils'
import type { ThroughputEstimator } from './ThroughputEstimator.ts'

/**
 * Arithmetic Mean throughput estimator
 *
 *
 * @beta
 */
export class ArithmeticMeanEstimator implements ThroughputEstimator {
	private samples: ResourceTiming[] = []

	public sample(sample: ResourceTiming): void {
		this.samples.push(sample)
	}

	public getEstimate(): number {
		let value: number = 0

		for (const sample of this.samples) {
			value += getBandwidthBps(sample)
		}

		return value / this.samples.length
	}
}
