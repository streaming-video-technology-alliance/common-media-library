/**
 * Exponential Weighted Moving Average (EWMA)
 *
 *
 * @beta
 */
export class Ewma {
	// The smoothing factor for the EWMA
	private alpha: number;
	// The current estimate of the throughput (in bits per second)
	private estimate: number;
	// The total duration of the resource (in seconds)
	private totalDuration: number;

	constructor(alpha: number) {
		this.alpha = alpha;
		this.estimate = 0;
		this.totalDuration = 0;
	}

	/**
	 * Samples the value of the resource and updates the estimate.
	 */
	public sample(weight: number, value: number): void {
		const adjustedAlpha = Math.pow(this.alpha, weight);
		this.estimate = adjustedAlpha * value + (1 - adjustedAlpha) * this.estimate;
		this.totalDuration += weight;
	}

	/**
	 * Returns the estimate of the value (in units, as `value` during sampling)
	 *
	 * For example, if the value is throughput (in bits per seconds), the estimate
	 * will also be in bits per seconds.
	 */
	public getEstimate(): number {
		const zeroFactor = 1 - Math.pow(this.alpha, this.totalDuration);
		return this.estimate / zeroFactor;
	}

	/**
	 * Returns the total duration of the resource (in units, as `weight` during sampling)
	 */
	public getTotalDuration(): number {
		return this.totalDuration;
	}
}
