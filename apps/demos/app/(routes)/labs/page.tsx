"use client";

import { useEffect } from "react";
import Link from 'next/link';

import { usePerformanceStats } from "@/hooks/usePerformanceStats";

const demos = [
	{
		name: "Demo 01",
		url: "demo-01",
		description: "Reading Tracker",
	},
	{
		name: "Demo 02",
		url: "demo-02",
		description: "Artistic card stacking",
	},
	{
		name: "Demo 03",
		url: "demo-03",
		description: "Iphone 17 Landing Page",
	},
];

export default function HomePage()
{
	const { setShowStats } = usePerformanceStats();
	
	useEffect( () => {
		setShowStats( false );
	}, [] );

	return (
		<>
			<div className="h-screen flex items-center justify-center bg-slate-900">
				<div className="container max-w-[50%] font-sans text-center text-white space-y-spacing-base">
					<h1 className="text-xl">Labs</h1>
					<p>Real-world UI and interaction experiments</p>
					<div className="text-slate-500 grid gap-spacing-base items-center justify-center">
						{ demos.map( ( demo ) => (
							<div key={ demo.url }>
								<p>{ demo.description }</p>
								<Link href={ `labs/${ demo.url }` } className="text-link">{ demo.name }</Link>
							</div>
						) ) }
					</div>
				</div>
			</div>
		</>
	)
}