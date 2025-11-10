import { Box } from '../Box.ts'
import { ContainerBox } from '../ContainerBox.ts'
import type { OriginalFormatBox } from '../OriginalFormatBox.ts'
import type { SchemeInformationBox } from './SchemeInformationBox.ts'
import type { SchemeTypeBox } from '../SchemeTypeBox.ts'

/**
 * Protection Scheme Information Box - 'sinf' - Container
 */
export class ProtectionSchemeInformationBox extends ContainerBox<OriginalFormatBox | Box | SchemeTypeBox | SchemeInformationBox> {
	static readonly type = 'sinf'
	constructor(boxes: (OriginalFormatBox | Box | SchemeTypeBox | SchemeInformationBox)[] = []) {
		super('sinf', boxes)
	}
}
