export class Vector2 
{
	x: number;
	y: number;

	constructor( x = 0, y = 0 )
	{
		this.x = x;
		this.y = y;
	}

	_set( x: number, y: number ): Vector2
	{
		this.x = x;
		this.y = y;
		return this;
	}

	_copy( v: Vector2 ): Vector2
	{
		this.x = v.x;
		this.y = v.y;
		return this;
	}

	_add( v: Vector2 ): Vector2 
	{
		this.x += v.x;
		this.y += v.y;
		return this;
	}

	_subVectors( a: Vector2, b: Vector2 ): Vector2 
	{
		this.x = a.x - b.x;
		this.y = a.y - b.y;
		return this;
	}

	_lengthSq(): number
	{
		return this.x * this.x + this.y * this.y;
	}
}