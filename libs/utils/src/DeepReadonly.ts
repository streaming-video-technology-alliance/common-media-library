/**
 * Utility type that marks every property of a given type as `readonly`,
 * recursively.
 *
 * `Readonly<T>` stops at the top level, so a nested object remains writable and
 * `value.nested.field = …` still compiles. `DeepReadonly` applies at every depth,
 * including through arrays.
 *
 * Functions keep their type, so callbacks on a value remain callable.
 * Primitives keep their type.
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
