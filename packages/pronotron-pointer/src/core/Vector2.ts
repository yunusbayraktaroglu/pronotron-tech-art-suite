/**
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

	set( x: number, y: number ): Vector2
	{
		this.x = x;
		this.y = y;
		return this;
	}

	copy( v: Vector2 ): Vector2
	{
		this.x = v.x;
		this.y = v.y;
		return this;
	}

	add( v: Vector2 ): Vector2 
	{
		this.x += v.x;
		this.y += v.y;
		return this;
	}

	subVectors( a: Vector2, b: Vector2 ): Vector2 
	{
		this.x = a.x - b.x;
		this.y = a.y - b.y;
		return this;
	}

	multiplyScalar( scalar: number ): Vector2
	{
		this.x *= scalar;
		this.y *= scalar;
		return this;
	}

	lengthSq(): number
	{
		return this.x * this.x + this.y * this.y;
	}

	clampScalar( minVal: number, maxVal: number ): Vector2
	{
		this.x = Math.max( minVal, Math.min( maxVal, this.x ) );
		this.y = Math.max( minVal, Math.min( maxVal, this.y ) );
		return this;
	}
}