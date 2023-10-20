export function symbolToStr(symbol: symbol) {
	return symbol.description || symbol.toString().slice(7, -1);
}
