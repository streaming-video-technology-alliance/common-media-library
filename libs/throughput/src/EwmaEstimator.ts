import type { ResourceTiming } from '@svta/cml-utils'
import { getBandwidthBps } from '@svta/cml-utils'
import { Ewma } from './Ewma.ts'
import type { EwmaEstimatorOptions } from './EwmaEstimatorOptions.ts'
import { isValidSample } from './isValidSample.ts'
import type { ThroughputEstimator } from './ThroughputEstimator.ts'

/**
 * Exponential Weighted Moving Average (EWMA) throughput estimator based on 2 half-lives
 *
 * @example
 * {@includeCode ../test/EwmaEstimator.test.ts#example}
 *
 * @public
 */
export class EwmaEstimator implements ThroughputEstimator {
	private defaultEstimate: number
	private minTotalBytes: number
	private minBodySize: number
	private totalBytes: number = 0
	private hasSamples: boolean = false
	private fastEwma: Ewma
	private slowEwma: Ewma

	public constructor(options: EwmaEstimatorOptions) {
		this.minTotalBytes = options.minTotalBytes || 0
		this.minBodySize = options.minBodySize || 0
		this.defaultEstimate = options.defaultEstimate ?? NaN

		this.slowEwma = new Ewma(halfLifeToAlpha(options.slowHalfLife))
		this.fastEwma = new Ewma(halfLifeToAlpha(options.fastHalfLife))
	}

	public sample(sample: ResourceTiming): void {
		const { encodedBodySize } = sample

		if (!isValidSample(sample) || encodedBodySize < this.minBodySize) {
			return
		}

		const durationSeconds = sample.duration / 1000
		const bandwidthBps = getBandwidthBps(sample)
		this.totalBytes += encodedBodySize
		this.hasSamples = true

		this.slowEwma.sample(durationSeconds, bandwidthBps)
		this.fastEwma.sample(durationSeconds, bandwidthBps)
	}

	public getEstimate(): number {
		if (!this.hasSamples || this.totalBytes < this.minTotalBytes) {
			return this.defaultEstimate
		}

		return Math.floor(Math.min(this.fastEwma.getEstimate(), this.slowEwma.getEstimate()))
	}
}

function halfLifeToAlpha(halfLife: number): number {
	return halfLife ? Math.exp(Math.log(0.5) / halfLife) : 0
}
