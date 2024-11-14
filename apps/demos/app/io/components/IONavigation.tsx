"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from 'next/navigation'

export function IONavigation()
{
	const pathname = usePathname();
	const navItems = useMemo(() => [
		{ href: "/io", label: "Mixed" },
		{ href: "/io/shared/page-1", label: "Page 1" },
		{ href: "/io/shared/page-2", label: "Page 2" },
		{ href: "/io/stress-test", label: "Stress Test" },
	], []);

	return (
		<>
			<nav className="flex flex-row items-center space-x-1">
				{ navItems.map( item => {
					const color = item.href !== pathname ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"	
					return (
						<Link
							scroll={ false }
							key={ item.href } 
							href={ item.href } 
							className={ `text-white py-2 px-4 leading-none rounded-full transition-colors ${ color }` }
						>{ item.label }</Link>
					)
				}) }
			</nav>
			<nav className="flex flex-row items-center space-x-3">
				<button onClick={() => { window.scrollTo({ top: 0, behavior: 'instant' }) }} className="underline">Scroll Top</button>
				<button onClick={() => { window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }) }} className="underline">Scroll Bottom</button>
			</nav>
		</>
	)
}