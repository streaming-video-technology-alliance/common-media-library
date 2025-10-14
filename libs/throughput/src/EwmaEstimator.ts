import type { ResourceTiming } from '@svta/cml-utils';
import { getBandwidthBps } from '@svta/cml-utils';
import { Ewma } from './Ewma.ts';
import type { EwmaEstimatorOptions } from './EwmaEstimatorOptions.ts';
import type { ThroughputEstimator } from './ThroughputEstimator.ts';

/**
 * Exponential Weighted Moving Average (EWMA) throughput estimator based on 2 half-lives
 *
 *
 * @beta
 */
export class EwmaEstimator implements ThroughputEstimator {
	private defaultEstimate: number;
	private minTotalBytes: number;
	private minBodySize: number;
	private totalBytes: number = 0;
	private fastEwma: Ewma;
	private slowEwma: Ewma;

	public constructor(options: EwmaEstimatorOptions) {
		this.minTotalBytes = options.minTotalBytes || 0;
		this.minBodySize = options.minBodySize || 0;
		this.defaultEstimate = options.defaultEstimate ?? NaN;

		this.slowEwma = new Ewma(options.slowHalfLife);
		this.fastEwma = new Ewma(options.fastHalfLife);

		if (!isNaN(this.defaultEstimate)) {
			this.fastEwma.sample(1, this.defaultEstimate);
			this.slowEwma.sample(1, this.defaultEstimate);
		}
	}

	public sample(sample: ResourceTiming): void {
		const { encodedBodySize, duration } = sample;

		if (!Number.isFinite(encodedBodySize) || !Number.isFinite(duration)) {
			return;
		}

		if (encodedBodySize < this.minBodySize) {
			return;
		}

		const durationSeconds = sample.duration / 1000;
		const bandwidthBps = getBandwidthBps(sample);
		this.totalBytes += encodedBodySize;

		this.slowEwma.sample(durationSeconds, bandwidthBps);
		this.fastEwma.sample(durationSeconds, bandwidthBps);
	}

	public getEstimate(): number {
		if (this.totalBytes < this.minTotalBytes) {
			return this.defaultEstimate;
		}

		return Math.floor(Math.min(this.fastEwma.getEstimate(), this.slowEwma.getEstimate()));
	}
}
