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

function returnDispatchWithRetry( id: number | string ){
	return {
		onTopIn: {
			dispatch: () => console.log( "Top-in Once", id ),
			limit: 1
		},
		onTopOut: {
			dispatch: () => console.log( "Top-out Once", id ),
			limit: 1,
		},
		onBottomOut: {
			dispatch: () => console.log( "Bottom-out Once", id ),
			limit: 1
		},
		onBottomIn: {
			dispatch: () => console.log( "Bottom-in Once", id ),
			limit: 1
		},
		onInViewport: ( normalizedPosition: number ) => {
			console.log( normalizedPosition );
		},
		//onFastForward: "skip_both",
	};
}

function returnDispatch( id: number | string ){
	return {
		onTopIn: () => console.log( "Top-in Once", id ),
		onTopOut: () => console.log( "Top-out Once", id ),
		onBottomOut: () => console.log( "Bottom-out Once", id ),
		onBottomIn: () => console.log( "Bottom-in Once", id ),
		onInViewport: ( normalizedPosition: number ) => {
			console.log( normalizedPosition );
		},
		//onFastForward: "skip_both",
	};
}

export function IOLineDomManipulate({ id, color, topIn, topOut, bottomIn, bottomOut }: IOLineDomManipulateProps)
{
	const [ state, setState ] = useState<string | false>( false );

	return (
		<div className="flex flex-col">
			<p className="text-center">{ id }:{ color } - <strong>Last event:{ state ?? "idle" }</strong></p>
			<div className="bg-green-500">
				<IODispatcher 
					className={ `block min-h-[1px] w-full ${ colorMap[ color ] } my-[120px]` }
					offset={ 120 }
					dispatch={ returnDispatch( id ) }
				/>
			</div>
			<p className="text-center">{ id }:{ color } - <strong>Last event:{ state ?? "idle" }</strong></p>
		</div>
	)
}