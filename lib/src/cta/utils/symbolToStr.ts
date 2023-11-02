import { SfToken } from '../../structuredfield/SfToken';

export function symbolToStr(symbol: symbol | SfToken) {
	return symbol.description || symbol.toString().slice(7, -1);
}
