import { CursorView } from './CursorView.js';

export function createCursorView(raw: ArrayBuffer | DataView | CursorView): CursorView {
	return raw instanceof CursorView ? raw : new CursorView(raw);
}
