import type { CmValue } from '@svta/cml-cta'
import { isTokenField, isValid } from '@svta/cml-cta'
import { SfToken } from '@svta/cml-structured-field-values'
import type { CmsdEncodeOptions } from '../CmsdEncodeOptions.ts'
import type { CmsdStatic } from '../CmsdStatic.ts'

export function processCmsd(obj: CmsdStatic, options?: CmsdEncodeOptions): CmsdStatic {
	const results: CmsdStatic = {}

	if (obj == null || typeof obj !== 'object') {
		return results
	}

	const keys = Object.keys(obj) as (keyof CmsdStatic)[]
	const useSymbol = options?.useSymbol !== false

	keys.forEach(key => {
		let value = obj[key] as CmValue

		// Version should only be reported if not equal to 1.
		if (key === 'v' && value === 1) {
			return
		}

		// ignore invalid values
		if (!isValid(value)) {
			return
		}

		if (isTokenField(key) && typeof value === 'string') {
			value = useSymbol ? Symbol.for(value) : new SfToken(value)
		}

		results[key as any] = value as any
	})

	return results
}
