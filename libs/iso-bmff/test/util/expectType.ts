/** `true` when `A` and `B` are the same type, otherwise `false`. */
export type Equal<A, B> =
	(<X>() => X extends A ? 1 : 2) extends <X>() => X extends B ? 1 : 2 ? true : false

/** Compile-time assertion. `expectType<Equal<A, B>>(true)` compiles only when `A` and `B` are the same type. */
export function expectType<T>(value: T): T {
	return value
}
