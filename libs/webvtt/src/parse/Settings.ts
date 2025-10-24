import type { WebVttRegion } from '../WebVttRegion.ts'

export type SettingsValue = WebVttRegion | string | number | boolean | null;

// A settings object holds key/value pairs and will ignore anything but the first
// assignment to a specific key.
export class Settings {
	private values: Record<string, SettingsValue>

	constructor() {
		this.values = Object.create(null)
	}

	// Only accept the first assignment to any key.
	set(k: string, v: SettingsValue): void {
		if (this.get(k) || v === '') {
			return
		}

		this.values[k] = v
	}

	// Return the value for a key, or a default value.
	// If 'defaultKey' is passed then 'dflt' is assumed to be an object with
	// a number of possible default values as properties where 'defaultKey' is
	// the key of the property that will be chosen; otherwise it's assumed to be
	// a single value.
	get<T = SettingsValue>(k: string, dflt?: T): T {
		if (this.has(k)) {
			return this.values[k] as T
		}

		return dflt as T
	}

	// Check whether we have a value for a key.
	has(k: string): boolean {
		return k in this.values
	}

	// Accept a setting if its one of the given alternatives.
	alt(k: string, v: string, a: string[]): void {
		for (const n of a) {
			if (v === n) {
				this.set(k, v)
				break
			}
		}
	}

	// Accept a setting if its a valid (signed) integer.
	integer(k: string, v: string): void {
		if (/^-?\d+$/.test(v)) { // integer
			this.set(k, parseInt(v, 10))
		}
	}

	// Accept a setting if its a valid percentage.
	percent(k: string, v: string): boolean {
		if (v.match(/^([\d]{1,3})(\.[\d]*)?%$/)) {
			const value = parseFloat(v)
			if (value >= 0 && value <= 100) {
				this.set(k, value)
				return true
			}
		}

		return false
	}
}
