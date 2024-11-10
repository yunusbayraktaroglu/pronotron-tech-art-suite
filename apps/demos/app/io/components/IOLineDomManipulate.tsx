import { useState } from "react";
import { IODispatcher } from "@/app/io/hooks/IODispatcher";

const colorMap = {
	blue: "bg-blue-500",
	red: "bg-red-500",
	orange: "bg-orange-500",
	purple: "bg-purple-500",
	green: "bg-green-500",
};


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
			<div className="bg-green-500">
				<IODispatcher 
					className={ `block min-h-[1px] w-full ${ colorMap[ color ] } my-[120px]`}
					offset={ 120 }
					dispatch={{
						visible: ( normalizedPosition ) => {
							console.log( normalizedPosition );
						},
						"top-in": topIn ? () => setState( "Top-in" ) : undefined,
						"top-out": topOut ? () => setState( "Top-out" ) : undefined,
						"bottom-in": bottomIn ? () => setState( "Bottom-in" ) : undefined,
						"bottom-out": bottomOut ? () => setState( "Bottom-out" ) : undefined,
					}}
				/>
			</div>
			<p className="text-center">{ id }:{ color } - <strong>Last event:{ state ?? "idle" }</strong></p>
		</div>
	)
}

const dispatch = {
	onViewport: ( normalizedPosition: number ) => console.log( "Element is in the viewport" ),
	onTopOut: () => console.log( "Element top-out" ),
	counter: {
		topIn: 2,
		topOut: 1,
	},
	topIn: {
		dispatch: () => console.log( "deneme" ),
		retry: 2
	},
}