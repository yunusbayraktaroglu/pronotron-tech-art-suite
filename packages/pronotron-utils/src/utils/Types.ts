/**
 * Ensures that an object of type T has `at least one property` defined.
 * All other properties remain optional.
 */
export type RequireAtLeastOne<T> = {
	[ K in keyof T ]: Pick<T, K> & Partial<T>;
}[ keyof T ];

/**
 * Ensures that an object of type T has `exactly one property` defined.
 * All other properties are disallowed (cannot exist).
 */
export type RequireExactlyOne<T> = {
	[ K in keyof T ]: { [ P in K ]: T[ P ] } & Partial<Record<Exclude<keyof T, K>, never>>;
}[ keyof T ];

/**
 * Maps each member of a numeric enum `E` to a `number` value.
 * 
 * @example
 * ```ts
 * enum Status { 
 * 	Idle = 0, 
 * 	Running = 1, 
 * 	Done = 2 
 * }
 * const statusDurations: EnumValueMap<Status> = {
 *   [Status.Idle]: 100,
 *   [Status.Running]: 500,
 *   [Status.Done]: 0,
 * };
 * ```
 */
export type EnumValueMap<E extends number> = {
	[ Member in E ]: number;
};

export type BinaryBoolean = 1 | 0;

/**
 * Extracts all unique keys from every member of a union type.
 * 
 * Example:
 *   type U = { a: number } | { b: string };
 *   KeysOfUnion<U> → "a" | "b"
 */
export type KeysOfUnion<U> = U extends any ? keyof U : never;

/**
 * Merges all properties from a union of object types into one
 * “combined shape” type, preserving each property’s possible types.
 *
 * Example:
 *   type U = { a: number } | { b: string };
 *   MergedProps<U> → { a: number; b: string }
 */
export type MergedProps<U> = {
  [ K in KeysOfUnion<U> ]: Extract<U, Record<K, any>> extends Record<K, infer P> ? P : never;
};

/**
 * Creates a type that enforces **at least one** member of a union `U`
 * to be present, while keeping the other possible properties optional.
 *
 * Each variant in the resulting type corresponds to one union member
 * whose keys are required, while the remaining members’ keys are optional
 * but still properly typed.
 *
 * Example:
 *   type U = { a: number } | { b: string };
 *   RequireAtLeastOneFromUnion<U> → 
 *     | { a: number; b?: string }
 *     | { b: string; a?: number }
 */
export type RequireAtLeastOneFromUnion<U extends object> = U extends any 
  ? ( U & Partial<Pick<MergedProps<U>, Exclude<KeysOfUnion<U>, keyof U>>> ) 
  : never;