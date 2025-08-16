"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePerformanceStats } from "./hooks/usePerformanceStats";

export default function HomePage()
{
	const { setIsActive } = usePerformanceStats();
	
	useEffect(() => {
		setIsActive( false );
	}, []);

	return (
		<>
			<main className="container min-h-screen flex flex-col justify-center">
				<div className="mb-spacing-lg space-y-spacing-xs">
					<h1 className="text-3xl">Pronotron <span className="whitespace-nowrap">Tech-Art</span> Suite</h1>
					<p>A high-performance TypeScript-based suite designed to enhance interaction, UI, and UX without compromising web standards.</p>
				</div>
				<div className="grid grid-cols-2 landscape:grid-cols-3 gap-spacing-sm">
					<PackageCard 
						name="Pronotron IO"
						description="Reliable viewport tracking without missed targets, unlike the default IntersectionObserver API."
						href="/io"
					/>
					<PackageCard 
						name="Pronotron Pointer"
						description="Tracks mouse and touch pointers with custom states such as holding, tapping, idling, interacting, moving out, and moving in, providing enhanced interaction control."
						href="/pointer"
					/>
					<PackageCard 
						name="Pronotron Animator"
						description="Built on NativeControlTable and Clock, it provides per-frame normalized timeline data (ranging from 0 to 1), enabling developers to create any kind of animation."
						href="/animator"
					/>
				</div>
			</main>
		</>
	)

}


interface PackageCardProps extends React.ComponentProps<typeof Link> {
	name: string;
	description: string;
};

function PackageCard({ name, description, ...linkProps }: PackageCardProps )
{
	return (
		<Link 
			className="flex justify-center rounded-lg transition-colors bg-slate-700 hover:bg-slate-600 text-white p-spacing-base"
			{ ...linkProps }
		>
			<div className="flex flex-col space-y-spacing-xs">
				<h2 className="text-xl">{ name }</h2>
				<p className="text-sm">{ description }</p>
			</div>
		</Link>
	)
}