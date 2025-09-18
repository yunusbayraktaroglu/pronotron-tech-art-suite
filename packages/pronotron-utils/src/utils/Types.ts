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
 * A type mapping every member of given numeric enum `E` to a value of type `number`.
 */
export type EnumValueMap<E extends number> = {
	[ Member in E ]: number;
};

export type BinaryBoolean = 1 | 0;