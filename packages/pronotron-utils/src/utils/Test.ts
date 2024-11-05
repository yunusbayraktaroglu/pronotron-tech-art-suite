// enums may vary too much
enum Size {
    Small,
    Medium,
    Large,
};
type EnumValues<T> = T[keyof T] extends number ? T[keyof T] : never;

class NativeControlTable2<T extends Record<string | number, string | number>> 
{
    stride: number;
	controlTable: Uint8Array;

    constructor( enumType: T, nodeCountHint: number )
	{
        this.stride = Object.keys( enumType ).length / 2;
		this.controlTable = new Uint8Array( this.stride );
    }

    addSlot( id: string, animation: { [K in EnumValues<T>]: number } )
	{
		for ( const [ key, value ] of Object.entries<number>( animation ) ){
			// [Size.Medium] converts to string
			// To be typesafe that method is the best
			this.controlTable[ Number( key ) ] = value;
		}
    }
}


const deneme = new NativeControlTable2( Size, 10 );
deneme.addSlot( "Size", {
	[Size.Medium]: 5,
	[Size.Small]: 1,
	[Size.Large]: 10,
});