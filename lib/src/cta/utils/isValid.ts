import { CmValue } from '../CmValue.js';

export const isValid = (value: CmValue) => {
	if (typeof value === 'number') {
		return Number.isFinite(value);
	}

	return value != null && value !== '' && value !== false;
};
