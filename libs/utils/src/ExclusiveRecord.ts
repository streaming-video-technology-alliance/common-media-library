/**
 * A record that is exclusive to a given key.
 *
 * @public
 */
export type ExclusiveRecord<K extends PropertyKey, V> = {
	[P in K]: Record<P, V> &
	Partial<Record<Exclude<K, P>, never>> extends infer O
	? { [Q in keyof O]: O[Q] }
	: never;
}[K];
