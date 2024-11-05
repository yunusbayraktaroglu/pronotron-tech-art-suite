"use client";

import { IODispatcher } from "../hooks/IODispatcher";
import { ScrollPerformanceUI } from "../ui/ScrollPerformance";

export default function PerformanceTest()
{
	return (
		<div>
			<ScrollPerformanceUI />
			{ Array.from({ length: 100 }).map(( item, index ) => {
				return (
					<>
						<div className="flex h-[90vh] relative">
							<p>#{ index } Dynamic line (top-in, top-out)</p>
							<IODispatcher
								className="absolute block min-h-[2px] w-full touch-none pointer-events-none select-none bg-green-500"
								dispatch={{
									"top-in": () => console.log( `${ index }: top-in` ),
									"top-out": () => console.log( `${ index }: top-out` ),
								}} 
							/>
						</div>
						<div className="flex h-[50vh]" />
					</>
				)
			}) }
		</div>
	);
}