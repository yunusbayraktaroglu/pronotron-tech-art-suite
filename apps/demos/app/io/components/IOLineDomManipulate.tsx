import { useState } from "react";
import { IODispatcher } from "@/app/io/hooks/IODispatcher";

interface IOLineDomManipulateProps {
	id: number | string;
	color: "blue" | "red" | "orange" | "purple" | "green";
	topIn?: boolean;
	topOut?: boolean;
	bottomIn?: boolean;
	bottomOut?: boolean;
};

export function IOLineDomManipulate({ id, color, topIn, topOut, bottomIn, bottomOut }: IOLineDomManipulateProps)
{
	const [ state, setState ] = useState<string | false>( false );

	return (
		<div className="flex flex-col">
			<p className="text-center">{ id }:{ color } - <strong>Last event:{ state ?? "idle" }</strong></p>
			<IODispatcher 
				className={ `block min-h-[3px] w-full bg-${ color }-500 my-4`}
				//@ts-expect-error - Requires at least 1
				dispatch={{
					"top-in": topIn ? () => setState( "Top-in" ) : undefined,
					"top-out": topOut ? () => setState( "Top-out" ) : undefined,
					"bottom-in": bottomIn ? () => setState( "Bottom-in" ) : undefined,
					"bottom-out": bottomOut ? () => setState( "Bottom-out" ) : undefined,
				}}
			/>
			<p className="text-center">{ id }:{ color } - <strong>Last event:{ state ?? "idle" }</strong></p>
		</div>
	)
}