"use client";

import Link from "next/link";

import { PronotronIOProvider } from "./hooks/PronotronIOProvider";
import { IODispatcher } from "./hooks/IODispatcher";

export default function Layout({ children }: Readonly<{ children: React.ReactNode }> )
{
	return (
		<div className="flex flex-col p-8 bg-slate-200">
			<h1>IO Testing page</h1>
			<p>Static: Will not be unmount while navigation</p>
			<p>Dynamic: Will be unmount and auto removed from IO</p>
			<nav className="flex flex-row items-center py-4 mb-10 sticky top-0 z-50 space-x-1">
				<Link href="/io" className="py-2 px-4 leading-none bg-slate-300 hover:bg-slate-400 rounded-full transition-colors">Page 1</Link>
				<Link href="/io/page-2" className="py-2 px-4 leading-none bg-slate-300 hover:bg-slate-400 rounded-full transition-colors">Page 2</Link>
				<Link href="/io/page-3" className="py-2 px-4 leading-none bg-slate-300 hover:bg-slate-400 rounded-full transition-colors">Page 3</Link>
				<Link href="/io/performance" className="py-2 px-4 leading-none bg-slate-300 hover:bg-slate-400 rounded-full transition-colors">Performance Test</Link>
			</nav>
			<PronotronIOProvider>
				<div className="flex flex-row items-center relative h-[80vh]">
					<div>
						<p>Static line (top-in, top-out)</p>
						<IODispatcher 
							className="absolute block min-h-[3px] w-full touch-none pointer-events-none select-none bg-red-500"
							dispatch={{
								"top-in": () => console.log( "RED: top-in static" ),
								"top-out": () => console.log( "RED: top-out static" )
							}} 
						/>
					</div>
				</div>
				{ children }
			</PronotronIOProvider>
		</div>
	);
}