"use client";

import { IODispatcher } from "../hooks/IODispatcher";
import { FPSTracker } from "../ui/ScrollPerformance";

export default function PerformanceTest()
{
	return (
		<div>
			<div className="fixed right-0 top-0 p-3 bg-red-300">
				<p>FPS: <span><FPSTracker /></span></p>
			</div>
			{ Array.from({ length: 20 }).map(( item, index ) => {
				return (
					<div className="flex h-[110vh] landscape:h-[90vh] relative" key={ index }>
						<p>#{ index } Dynamic line (top-in, top-out)</p>
						<IODispatcher
							className="absolute block min-h-[2px] w-full touch-none pointer-events-none select-none bg-green-500"
							dispatch={{
								"top-in": () => console.log( `${ index }: top-in` ),
								"top-out": () => console.log( `${ index }: top-out` ),
							}} 
						/>
						<div className="flex h-[50vh]" />
					</div>
				)
			}) }
		</div>
	);
}