/**
 * Exponential Weighted Moving Average (EWMA)
 *
 * Each sample has a weight, for example the duration of a download in seconds.
 * A half-life of `h` weight units corresponds to an `alpha` of `Math.exp(Math.log(0.5) / h)`.
 *
 * @example
 * {@includeCode ../test/Ewma.test.ts#example}
 *
 * @public
 */
export class Ewma {
	// The smoothing factor for the EWMA, between 0 and 1
	private alpha: number
	// The current estimate (in units, as `value` during sampling)
	private estimate: number
	// The total weight of the samples (in units, as `weight` during sampling)
	private totalDuration: number

	/**
	 * @param alpha - The smoothing factor, between 0 and 1. A larger `alpha` expires old samples more slowly.
	 */
	constructor(alpha: number) {
		this.alpha = alpha
		this.estimate = 0
		this.totalDuration = 0
	}

	/**
	 * Samples the value of the resource and updates the estimate.
	 *
	 * The new value has the weight `1 - alpha ^ weight`.
	 * The method ignores a sample that would make the estimate `NaN`.
	 */
	public sample(weight: number, value: number): void {
		const adjustedAlpha = Math.pow(this.alpha, weight)
		const estimate = value * (1 - adjustedAlpha) + adjustedAlpha * this.estimate

		if (Number.isNaN(estimate)) {
			return
		}

		this.estimate = estimate
		this.totalDuration += weight
	}

	/**
	 * Returns the estimate of the value (in units, as `value` during sampling)
	 *
	 * For example, if the value is throughput (in bits per seconds), the estimate
	 * will also be in bits per seconds.
	 */
	public getEstimate(): number {
		if (this.alpha !== 0) {
			const zeroFactor = 1 - Math.pow(this.alpha, this.totalDuration)

			if (zeroFactor !== 0) {
				return this.estimate / zeroFactor
			}
		}

		return this.estimate
	}

	/**
	 * Returns the total duration of the resource (in units, as `weight` during sampling)
	 */
	public getTotalDuration(): number {
		return this.totalDuration
	}
}
