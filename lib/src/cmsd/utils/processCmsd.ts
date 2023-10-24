import { CmValue } from '../../cta/CmValue.js';
import { isTokenField } from '../../cta/utils/isTokenField.js';
import { isValid } from '../../cta/utils/isValid.js';
import { SfToken } from '../../structuredfield/SfToken.js';
import { CmsdEncodeOptions } from '../CmsdEncodeOptions.js';
import { CmsdStatic } from '../CmsdStatic.js';

export function processCmsd(obj: CmsdStatic, options?: CmsdEncodeOptions) {
	const results: CmsdStatic = {};

	if (obj == null || typeof obj !== 'object') {
		return results;
	}

	const keys = Object.keys(obj) as (keyof CmsdStatic)[];
	const useSymbol = options?.useSymbol !== false;

	keys.forEach(key => {
		let value = obj[key] as CmValue;

		// Version should only be reported if not equal to 1.
		if (key === 'v' && value === 1) {
			return;
		}

		// ignore invalid values
		if (!isValid(value)) {
			return;
		}

		if (isTokenField(key) && typeof value === 'string') {
			value = useSymbol ? Symbol.for(value) : new SfToken(value);
		}

		results[key as any] = value as any;
	});

	return results;
}
