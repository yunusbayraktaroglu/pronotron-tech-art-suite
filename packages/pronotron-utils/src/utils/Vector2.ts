/**
 * Class representing a 2D vector. A 2D vector is an ordered pair of numbers
 * (labeled x and y), which can be used to represent a number of things, such as:
 *
 * - A point in 2D space (i.e. a position on a plane).
 * - A direction and length across a plane. In three.js the length will
 * always be the Euclidean distance(straight-line distance) from `(0, 0)` to `(x, y)`
 * and the direction is also measured from `(0, 0)` towards `(x, y)`.
 * - Any arbitrary ordered pair of numbers.
 * Iterating through a vector instance will yield its components `(x, y)` in
 * the corresponding order.
 * 
 * @example
 * ```typescript
 * const vector = new Vector2( 0, 1 );
 * ```
 * 
 * @see https://github.com/mrdoob/three.js/blob/master/src/math/Vector2.js
 */
export class Vector2 
{
	x: number;
	y: number;

	constructor( x = 0, y = 0 )
	{
		this.x = x;
		this.y = y;
	}

	/**
	 * Sets the vector components.
	 *
	 * @param x - The value of the x component.
	 * @param y - The value of the y component.
	 * @return A reference to this vector.
	 */
	set( x: number, y: number ): Vector2
	{
		this.x = x;
		this.y = y;
		return this;
	}

	/**
	 * Adds the given vector to this instance.
	 *
	 * @param v - The vector to add.
	 * @return A reference to this vector.
	 */
	add( v: Vector2 ): Vector2 
	{
		this.x += v.x;
		this.y += v.y;
		return this;
	}

	/**
	 * Subtracts the given vectors and stores the result in this instance.
	 *
	 * @param a - The first vector.
	 * @param b - The second vector.
	 * @return  A reference to this vector.
	 */
	sub( a: Vector2, b: Vector2 ): Vector2 
	{
		this.x = a.x - b.x;
		this.y = a.y - b.y;
		return this;
	}

	/**
	 * Computes the square of the Euclidean length (straight-line length) from
	 * (0, 0) to (x, y). If you are comparing the lengths of vectors, you should
	 * compare the length squared instead as it is slightly more efficient to calculate.
	 *
	 * @return The square length of this vector.
	 */
	lengthSq(): number
	{
		return this.x * this.x + this.y * this.y;
	}

	/**
	 * If this vector's x or y value is greater than the max vector's x or y
	 * value, it is replaced by the corresponding value.
	 * If this vector's x or y value is less than the min vector's x or y value,
	 * it is replaced by the corresponding value.
	 *
	 * @param min - The minimum x and y values.
	 * @param max - The maximum x and y values in the desired range.
	 * @return A reference to this vector.
	 */
	clamp( min: Vector2, max: Vector2 ): Vector2
	{
		// assumes min < max, componentwise
		this.x = clamp( this.x, min.x, max.x );
		this.y = clamp( this.y, min.y, max.y );

		return this;
	}
	
	/**
	 * Copies the values of the given vector to this instance.
	 *
	 * @param {Vector2} v - The vector to copy.
	 * @return {Vector2} A reference to this vector.
	 */
	copy( v: Vector2 ): Vector2
	{
		this.x = v.x;
		this.y = v.y;
		return this;
	}

	*[ Symbol.iterator ]()
	{
		yield this.x;
		yield this.y;
	}
}

function clamp( value: number, min: number, max: number )
{
	return Math.max( min, Math.min( max, value ) );
}