/**
 * Utility type that marks every property of a given type as `readonly`,
 * recursively.
 *
 * `Readonly<T>` stops at the top level, so a nested object stays writable and
 * `value.nested.field = …` still compiles. This applies at every depth,
 * including through arrays.
 *
 * Functions are left unchanged so callbacks carried on a value stay callable,
 * and primitives are returned as they are.
 *
 * @typeParam T - The type to make deeply readonly.
 *
 * @example
 * {@includeCode ../test/DeepReadonly.test.ts#example}
 *
 * @public
 */
export type DeepReadonly<T> = T extends (...args: never[]) => unknown ? T
	: T extends readonly (infer U)[] ? readonly DeepReadonly<U>[]
	: T extends object ? { readonly [P in keyof T]: DeepReadonly<T[P]>; }
	: T;
