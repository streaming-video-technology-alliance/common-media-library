import type { SfItem } from '@svta/cml-structured-field-values'
import type { ExclusiveRecord } from '@svta/cml-utils'
import type { CmcdObjectType } from './CmcdObjectType.ts'

/**
 * A numeric list with an optional object type boolean flag.
 *
 * @public
 */
export type CmcdObjectTypeList = (number | SfItem<number, ExclusiveRecord<CmcdObjectType, boolean>>)[];
