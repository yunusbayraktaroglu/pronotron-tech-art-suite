"use client";

import { useMemo } from "react";
import { usePathname } from 'next/navigation'
import Link from "next/link";

export function IONavigation()
{
	const pathname = usePathname();
	
	const navItems = useMemo(() => [
		{ href: "/io", label: "Single Node" },
		{ href: "/io/shared/page-1", label: "Page 1 (Sharing IO nodes)" },
		{ href: "/io/shared/page-2", label: "Page 2 (Sharing IO nodes)" },
		{ href: "/io/stress-test", label: "Stress Test" },
	], []);

	return (
		<header className="container flex flex-row flex-wrap items-center justify-between py-spacing-sm landscape:py-spacing-sm gap-spacing-sm">
			<div className="flex flex-col grow">
				<h3 className="text-xs leading-none mb-1 text-slate-500">Demos</h3>
				<nav className="flex flex-row flex-wrap items-center gap-spacing-xs">
					{ navItems.map( item => {
						const color = item.href !== pathname ? "bg-slate-400 hover:bg-slate-500" : "bg-blue-600 hover:bg-blue-700"	
						return (
							<Link
								scroll={ false }
								key={ item.href } 
								href={ item.href } 
								className={ `text-white text-sm py-3 px-5 leading-none rounded-full transition-colors ${ color }` }
							>{ item.label }</Link>
						)
					}) }
				</nav>
			</div>
			<nav className="flex flex-row grow justify-end items-center space-x-3 text-sm">
				<button onClick={() => { window.scrollTo({ top: 0, behavior: 'instant' }) }} className="underline">Scroll Top</button>
				<button onClick={() => { window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }) }} className="underline">Scroll Bottom</button>
			</nav>
		</header>
	)
}