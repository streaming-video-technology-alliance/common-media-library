import type { ResourceTiming } from '@svta/cml-utils'
import { getBandwidthBps } from '@svta/cml-utils'
import type { ThroughputEstimator } from './ThroughputEstimator.ts'

/**
 * Zero-Lag Exponential Moving Average (ZLEMA) throughput estimator
 *
 *
 * @beta
 */
export class ZlemaEstimator implements ThroughputEstimator {
	private samples: ResourceTiming[] = []

	public sample(sample: ResourceTiming): void {
		this.samples.push(sample)
	}

	public getEstimate(): number {
		if (this.samples.length === 0) {
			return NaN
		}

		const alpha = 2 / (this.samples.length + 1)

		let ema: number, zlema: number

		ema = zlema = getBandwidthBps(this.samples[this.samples.length - 1])

		for (const sample of this.samples) {
			ema = alpha * getBandwidthBps(sample) + (1 - alpha) * ema
			zlema = alpha * ema + (1 - alpha) * zlema
		}

		return zlema
	}
}
