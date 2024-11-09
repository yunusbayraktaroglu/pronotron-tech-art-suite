import { IODispatcher } from "@/app/io/hooks/IODispatcher";

interface IOLineLoggerProps {
	id: number | "string";
	color: "blue" | "red" | "orange" | "purple" | "green";
	topIn?: boolean;
	topOut?: boolean;
	bottomIn?: boolean;
	bottomOut?: boolean;
};

export function IOLineLogger({ id, color, topIn, topOut, bottomIn, bottomOut }: IOLineLoggerProps)
{
	return (
		<div className="flex flex-col">
			<p className="text-center">{ id }:{ color } - <strong>Logger</strong></p>
			<IODispatcher 
				className={ `block min-h-[3px] w-full bg-${ color }-500 my-3` }
				//@ts-expect-error - Requires at least 1
				dispatch={{
					"top-in": topIn ? () => console.log( `${ color }: top-in` ) : undefined,
					"top-out": topOut ? () => console.log( `${ color }: top-out` ) : undefined,
					"bottom-in": bottomIn ? () => console.log( `${ color }: bottom-in` ) : undefined,
					"bottom-out": bottomOut ? () => console.log( `${ color }: bottom-out` ) : undefined,
				}}
			/>
			<p className="text-center">{ id }:{ color } - <strong>Logger</strong></p>
		</div>
	)
}