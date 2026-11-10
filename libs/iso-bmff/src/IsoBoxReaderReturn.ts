import type { Box } from './boxes/Box.ts'
import type { IsoBox } from './IsoBox.ts'
import type { IsoBoxContainer } from './IsoBoxContainer.ts'
import type { IsoBoxType } from './IsoBoxType.ts'
import type { ParsedBox } from './ParsedBox.ts'

/**
 * The result type of `readIsoBoxes` for the reader map `R`.
 *
 * The type is a union of the boxes that the readers of `R` return.
 * `box.type === 'xxxx'` therefore narrows to the return type of the reader
 * under that key. An optional reader adds its return type without `undefined`.
 * A reader typed to return `unknown`, such as a value of `IsoBoxReaderMap`,
 * adds nothing.
 *
 * The union also has the boxes that the view returns without a reader:
 *
 * - When every key of `R` is a literal, the view reads the children of a
 *   container box and only the header of every other box. The union therefore
 *   has every container type whose key is not in `R`, and `ParsedBox<Box>` for
 *   a header-only box. A built-in box type whose key is not in `R` is not in
 *   the union.
 * - A key of `R` may not be a literal, such as `string` from a computed key or
 *   the `IsoBoxType` pattern of `IsoBoxReaderMap`. The map may then contain a
 *   reader for any box, so the union has every built-in box type.
 *
 * @public
 */
export type IsoBoxReaderReturn<R> =
	| NonNullable<
			{
				[K in keyof R]: NonNullable<R[K]> extends (...args: never[]) => infer B
					? unknown extends B
						? never
						: ParsedBox<B>
					: never
			}[keyof R]
	  >
	| ParsedBox<
			([IsoBoxType] extends [keyof R] ? IsoBox : Exclude<IsoBoxContainer, { type: keyof R }>) | Box
	  >
