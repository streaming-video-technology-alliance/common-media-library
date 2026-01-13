import type { ValueOf } from '@svta/cml-utils'

/**
 * The UTF8 field type
 *
 * @public
 */
export const UTF8 = 'utf8' as const

/**
 * The unsigned integer field type
 *
 * @public
 */
export const UINT = 'uint' as const

/**
 * The template field type
 *
 * @public
 */
export const TEMPLATE = 'template' as const

/**
 * The string field type
 *
 * @public
 */
export const STRING = 'string' as const

/**
 * The integer field type
 *
 * @public
 */
export const INT = 'int' as const

/**
 * The data field type
 *
 * @public
 */
export const DATA = 'data' as const

/**
 * The ISO BMFF field types
 *
 * @enum
 * @public
 */
export const IsoBoxFields = {
	DATA: DATA as typeof DATA,
	INT: INT as typeof INT,
	STRING: STRING as typeof STRING,
	TEMPLATE: TEMPLATE as typeof TEMPLATE,
	UINT: UINT as typeof UINT,
	UTF8: UTF8 as typeof UTF8,
}

/**
 * @public
 */
export type IsoBoxFields = ValueOf<typeof IsoBoxFields>
