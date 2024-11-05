"use client";

import { IODispatcher } from "../hooks/IODispatcher";

export default function Page()
{
	return (
		<div className="block">
			<div className="flex h-[90vh] relative">
				<span className="absolute block min-h-[2px] w-full touch-none pointer-events-none select-none bg-green-500"></span>
			</div>
			<div className="flex h-[50vh]" />
			<div className="flex h-[20vh] relative">
				<span className="absolute block min-h-[2px] w-full touch-none pointer-events-none select-none bg-green-500"></span>
			</div>
			<div className="flex h-[70vh]" />
			<div className="flex h-[20vh] relative">
				<span className="absolute block min-h-[2px] w-full touch-none pointer-events-none select-none bg-green-500"></span>
			</div>
			<div className="flex h-[70vh]" />
			<div className="flex h-[20vh] relative">
				<span className="absolute block min-h-[2px] w-full touch-none pointer-events-none select-none bg-green-500"></span>
			</div>
			<div className="flex h-[70vh]" />
		</div>
	)

}