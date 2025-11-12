import type { Box } from '../../boxes/Box.ts'
import type { BoxType } from '../../boxes/BoxType.ts'
import type { OriginalFormatBox } from '../../boxes/OriginalFormatBox.ts'
import type { ProtectionSchemeInformationBox } from '../../boxes/ProtectionSchemeInformationBox.ts'
import type { SchemeInformationBox } from '../../boxes/SchemeInformationBox.ts'
import type { SchemeTypeBox } from '../../boxes/SchemeTypeBox.ts'
import { ContainerBoxBase } from '../ContainerBoxBase.ts'

/**
 * Protection Scheme Information Box - 'sinf' - Container
 */
export class sinf extends ContainerBoxBase<ProtectionSchemeInformationBox, OriginalFormatBox | Box<BoxType> | SchemeTypeBox | SchemeInformationBox> {
	static readonly type = 'sinf'

	constructor(boxes: (OriginalFormatBox | Box<BoxType> | SchemeTypeBox | SchemeInformationBox)[] = []) {
		super('sinf', boxes)
	}
}
