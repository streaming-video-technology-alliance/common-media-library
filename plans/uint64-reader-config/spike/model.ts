// Type-level spike for the `int64` reader option (RFC: rfc/uint64-reader-config.md).
// A reduced model of the iso-bmff type plumbing. Nothing here is imported by libs/.
// The real package has 11 affected box types, 8 affected container types, and 66 readers.
// The model keeps one of each kind: tfdt (affected), mfhd (not affected), traf (container).

// ---------- the option ----------

/** The JavaScript type of a 64-bit integer field. The value of the `int64` option. */
export type IsoInt64 = 'number' | 'bigint'

/** Resolves the option to the field type. */
export type IsoInt64Value<I extends IsoInt64> = { number: number; bigint: bigint }[I]

// ---------- box types ----------

export type FullBox = { version: number; flags: number }
export type Box<T extends string = never> = { type: T }

/** Affected box. The 64-bit field follows the option. */
export type TrackFragmentBaseMediaDecodeTimeBox<I extends IsoInt64 = 'number'> = FullBox & {
	type: 'tfdt'
	baseMediaDecodeTime: IsoInt64Value<I>
}

/** Unaffected box. No type parameter. */
export type MovieFragmentHeaderBox = FullBox & {
	type: 'mfhd'
	sequenceNumber: number
}

/** Container of an affected box. The parameter flows through the child union. */
export type TrackFragmentBoxChild<I extends IsoInt64 = 'number'> =
	| TrackFragmentBaseMediaDecodeTimeBox<I>
	| MovieFragmentHeaderBox

export type TrackFragmentBox<I extends IsoInt64 = 'number'> = {
	type: 'traf'
	boxes: TrackFragmentBoxChild<I>[]
}

export type IsoBoxMap<I extends IsoInt64 = 'number'> = {
	mfhd: MovieFragmentHeaderBox
	tfdt: TrackFragmentBaseMediaDecodeTimeBox<I>
	traf: TrackFragmentBox<I>
}

export type IsoBox<I extends IsoInt64 = 'number'> = IsoBoxMap<I>[keyof IsoBoxMap<I>]

export type ParsedBox<T = Box, I extends IsoInt64 = 'number'> = (T extends IsoBox<I>
	? T & Omit<Box, 'type'>
	: T) & {
	view: IsoBoxReadView<I>
	size: number
	largesize?: number
}

export type ParsedIsoBox<I extends IsoInt64 = 'number'> = ParsedBox<IsoBox<I> | Box, I>

export type IsoTypedParsedBox<T extends keyof IsoBoxMap, I extends IsoInt64 = 'number'> = ParsedBox<
	IsoBoxMap<I>[T],
	I
>

// ---------- readers and config ----------

/**
 * The reader of one box. The third parameter is the option of the view that the reader
 * accepts. The default keeps `IsoBoxReader<B, T>` equal to today's type.
 */
export type IsoBoxReader<B = unknown, T extends string = string, I extends IsoInt64 = 'number'> = (
	view: IsoBoxReadView<I>,
	type: T,
) => B

/**
 * The map has one signature, so an inline reader gets its `view` parameter from context
 * in both modes, and a generic built-in reader is instantiated with the option of the call.
 */
export type IsoBoxReaderMap<I extends IsoInt64 = 'number'> = Record<
	string,
	IsoBoxReader<unknown, string, I>
>

/**
 * `int64` is optional for `'number'`, the default, and required for `'bigint'`.
 * A type that promises `bigint` fields therefore needs the option that produces them.
 */
export type IsoBoxReadViewConfig<I extends IsoInt64 = 'number'> = {
	readers?: IsoBoxReaderMap<I>
	/** What the view does when a 64-bit field is outside the safe integer range in number mode. */
	int64Overflow?: 'ignore' | 'throw' | ((error: RangeError) => void)
} & ([I] extends ['bigint'] ? { int64: I } : { int64?: I })

// ---------- the view (declaration only) ----------

export declare class IsoBoxReadView<I extends IsoInt64 = 'number'> {
	/**
	 * The stored readers use the default instantiation, so `I` appears in no parameter
	 * position and `IsoBoxReadView<'bigint'>` is assignable to `IsoBoxReadView<IsoInt64>`.
	 * The constructor casts the readers of the configuration once.
	 */
	private config: { readers?: IsoBoxReaderMap; int64?: I }
	/** The configuration is optional for the default mode and required for `'bigint'`. */
	constructor(
		raw: ArrayBuffer,
		...config: [I] extends ['bigint']
			? [config: IsoBoxReadViewConfig<I>]
			: [config?: IsoBoxReadViewConfig<I>]
	)
	readUint(size: number): number
	readUint64(): bigint
	readFullBox(): FullBox
	/** Reads a 4 or 8 byte unsigned field as the type the `int64` option selects. */
	readWideUint(size: 4 | 8): IsoInt64Value<I>
	slice(offset: number, size: number): IsoBoxReadView<I>
	[Symbol.iterator](): Generator<ParsedIsoBox<I>>
}

// ---------- the return type ----------

/**
 * The default union covers the boxes that have no reader in `R`. Today the type
 * includes every box, so a custom `tfdt` reader narrows to the union of its own
 * return type and the built-in `tfdt` type. The exclusion fixes that for every
 * caller, with or without the option.
 */
export type IsoBoxReaderReturn<R, I extends IsoInt64 = 'number'> =
	| {
			[K in keyof R]: R[K] extends (...args: never[]) => infer B ? ParsedBox<B, I> : never
	  }[keyof R]
	| ParsedBox<Exclude<IsoBox<I>, { type: keyof R }> | Box, I>

// ---------- entry points ----------

/**
 * `I` is inferred from `int64` and from the view parameter of every non-generic reader.
 * A reader that takes `IsoBoxReadView<'bigint'>` therefore infers `'bigint'`, and the
 * configuration type then requires the option. A generic reader adds no candidate.
 */
export declare function readIsoBoxes<
	const R extends IsoBoxReaderMap<I>,
	I extends IsoInt64 = 'number',
>(raw: ArrayBuffer, config: IsoBoxReadViewConfig<I> & { readers: R }): IsoBoxReaderReturn<R, I>[]
export declare function readIsoBoxes<I extends IsoInt64 = 'number'>(
	raw: ArrayBuffer,
	config?: IsoBoxReadViewConfig<I>,
): ParsedIsoBox<I>[]

export declare function isIsoBoxType<T extends keyof IsoBoxMap, I extends IsoInt64 = 'number'>(
	type: T,
	box: ParsedIsoBox<I> | IsoBox<I>,
): box is IsoTypedParsedBox<T, I>

// ---------- built-in readers ----------

/** A built-in reader of an affected box is generic in `I`. */
export declare function readTfdt<I extends IsoInt64>(
	view: IsoBoxReadView<I>,
): TrackFragmentBaseMediaDecodeTimeBox<I>

/**
 * A built-in reader of an unaffected box is generic too, so it takes a view of either mode
 * and adds no inference candidate for the option. Its return type does not use `I`.
 */
export declare function readMfhd<I extends IsoInt64>(
	view: IsoBoxReadView<I>,
): MovieFragmentHeaderBox

/**
 * `defaultReaderConfig` gains an optional argument that selects the mode of the returned
 * configuration. Spreading `defaultReaderConfig()` into a `'bigint'` configuration is a
 * compile error, because its readers are typed for the number view.
 */
export declare function defaultReaderConfig<I extends IsoInt64 = 'number'>(options?: {
	int64?: I
}): IsoBoxReadViewConfig<I>

// ---------- writers ----------

export declare class IsoBoxWriteView {
	constructor(type: string, size: number)
	writeUint(value: number, size: number): void
	writeUint64(value: bigint): void
	/** Writes a 4 or 8 byte unsigned field from either value type. */
	writeWideUint(value: number | bigint, size: 4 | 8): void
	readonly buffer: ArrayBufferLike
}

/** The input of the write functions. The parameter has to reach every alternative. */
export type IsoBoxStreamable<I extends IsoInt64 = 'number'> =
	| IsoBox<I>
	| ParsedIsoBox<I>
	| ParsedBox<unknown, I>
	| ArrayBufferView

/** The write functions take a box of either mode. No writer option. */
export declare function writeIsoBox(box: IsoBoxStreamable<IsoInt64>): Uint8Array<ArrayBuffer>

/** A built-in writer of an affected box takes the box of either mode. */
export declare function writeTfdt(
	box: TrackFragmentBaseMediaDecodeTimeBox<IsoInt64>,
): IsoBoxWriteView
