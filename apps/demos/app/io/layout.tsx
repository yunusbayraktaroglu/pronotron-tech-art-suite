"use client";

import Link from "next/link";

import { PronotronIOProvider } from "./hooks/PronotronIOProvider";
import { IOLineDomManipulate } from "./components/IOLineDomManipulate";

export default function Layout({ children }: Readonly<{ children: React.ReactNode }> )
{
	return (
		<div className="flex flex-col p-8 bg-slate-200">
			<h1 className="text-3xl mb-2">PronotronIO Demo</h1>
			<p className="text-xl">PronotronIO uses a single flatten <a className="underline" href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray#typedarray_objects" target="_blank" rel="noopener noreferrer">TypedArray</a> to hold/update data of IO nodes. Every scroll iterates over it and controls only possible events (scrolling-down: bottom-in, top-out, scrolling-up: bottom-out, top-in) and logicly activates related listen states when state is changed. Iteration over TypedArray helps lower-level access to memory.</p>
			<p className="text-xl">The built-in <a className="underline" href="https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API" target="_blank" rel="noopener noreferrer">IntersectionObserver API</a> may miss the targets in fast scrolls. But this does not.</p>
			<div className="my-3">
				<p>Following demo executes scroll in RequestAnimationFrame and <strong>do not</strong> uses <a className="underline" href="https://developer.mozilla.org/en-US/docs/Glossary/Throttle" target="_blank" rel="noopener noreferrer">throttle</a> function which would utilized in the production.</p>
				<p className="text-sm">Static: Will not be unmount while navigation</p>
				<p className="text-sm">Dynamic: Will be unmount and auto removed from IO</p>
				<p className="text-sm">Y positions will be changed by screen orientation (landscape, portrait)</p>
			</div>
			<header className="flex flex-row items-center justify-between py-4 mb-10 sticky top-0 z-50 ">
				<nav className="flex flex-row items-center space-x-1">
					<Link href="/io" className="py-2 px-4 leading-none bg-slate-300 hover:bg-slate-400 rounded-full transition-colors">Page 1</Link>
					<Link href="/io/page-2" className="py-2 px-4 leading-none bg-slate-300 hover:bg-slate-400 rounded-full transition-colors">Page 2</Link>
					<Link href="/io/stress" className="py-2 px-4 leading-none bg-slate-300 hover:bg-slate-400 rounded-full transition-colors">Stress Test</Link>
				</nav>
				<nav className="flex flex-row items-center space-x-1">
					<button onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth'})}}>Scroll Top</button>
					<button onClick={() => { window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }) }}>Scroll Bottom</button>
				</nav>
			</header>
			<div className="flex h-[40vh] landscape:h-[20vh] relative"></div>
			<PronotronIOProvider>
				<IOLineDomManipulate id="Static line" topOut topIn color="red" />
				{ children }
			</PronotronIOProvider>
		</div>
	);
}

