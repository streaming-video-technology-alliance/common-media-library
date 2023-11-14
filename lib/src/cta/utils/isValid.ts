import { CmValue } from '../CmValue';

export const isValid = (value: CmValue) => value != null && value !== '' && value !== false;
