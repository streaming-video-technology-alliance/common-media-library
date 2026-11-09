// Type-level spike for the `int64` reader option (RFC: rfc/int64-reader-config.md).
// A reduced model of the iso-bmff type plumbing. Nothing here is imported by libs/.
// The real package has 10 affected box types, 8 affected container types, and 66 readers.
// The model keeps one of each kind: tfdt (affected), mfhd (not affected), traf (container).

// ---------- the option ----------

/** The JavaScript type of a 64-bit field. The value of the `int64` option. */
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
 * `IsoBoxReader` keeps its one view parameter, the default `IsoBoxReadView<'number'>`,
 * so every custom reader written today stays valid.
 */
export type IsoBoxReader<B = unknown, T extends string = string, I extends IsoInt64 = 'number'> = (
	view: IsoBoxReadView<I>,
	type: T,
) => B

/**
 * The map accepts a reader of either view. The union matters for inference:
 * TypeScript instantiates a generic function against a contextual type that has
 * one non-generic call signature. A union of two signatures has no single
 * contextual signature, so a generic built-in reader keeps its type parameter
 * in `R` and `IsoBoxReaderBox` can resolve it against the option.
 */
export type IsoBoxReaderMap = Record<string, IsoBoxReader | IsoBoxReader<unknown, string, 'bigint'>>

export type IsoBoxReadViewConfig<I extends IsoInt64 = 'number'> = {
	readers?: IsoBoxReaderMap
	/**
	 * The JavaScript type of 64-bit fields in the built-in readers.
	 * @defaultValue 'number'
	 */
	int64?: I
}

// ---------- the view (declaration only) ----------

export declare class IsoBoxReadView<I extends IsoInt64 = 'number'> {
	constructor(raw: ArrayBuffer, config?: IsoBoxReadViewConfig<I>)
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
 * The box type that one reader contributes to the result.
 *
 * A built-in reader is generic in `I`. `infer` instantiates a generic function
 * with its constraint, which would give `number | bigint`. So the type first
 * checks whether the reader is a reader of `IsoBoxMap<I>[K]`, in both
 * directions, and uses the map type when it is. A custom reader that returns
 * more or less than the map type falls through to `infer`.
 */
export type IsoBoxReaderBox<F, K, I extends IsoInt64> = F extends (...args: never[]) => infer B
	? K extends keyof IsoBoxMap
		? [F] extends [(view: IsoBoxReadView<I>, type: K) => IsoBoxMap<I>[K]]
			? [IsoBoxMap<I>[K]] extends [B]
				? ParsedBox<IsoBoxMap<I>[K], I>
				: ParsedBox<B, I>
			: ParsedBox<B, I>
		: ParsedBox<B, I>
	: never

/**
 * The default union covers the boxes that have no reader in `T`. Today the type
 * includes every box, so a custom `tfdt` reader narrows to the union of its own
 * return type and the built-in `tfdt` type. The exclusion fixes that for every
 * caller, with or without the option.
 */
export type IsoBoxReaderReturn<T, I extends IsoInt64 = 'number'> =
	| { [K in keyof T]: IsoBoxReaderBox<T[K], K, I> }[keyof T]
	| ParsedBox<Exclude<IsoBox<I>, { type: keyof T }> | Box, I>

// ---------- entry point ----------

export declare function readIsoBoxes<
	const R extends IsoBoxReaderMap,
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

/** A built-in reader of an unaffected box does not change. */
export declare function readMfhd(view: IsoBoxReadView): MovieFragmentHeaderBox
