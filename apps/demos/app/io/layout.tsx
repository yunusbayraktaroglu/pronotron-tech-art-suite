import type { Metadata } from "next";
import { PronotronIOProvider } from "./hooks/PronotronIOProvider";
import { IONavigation } from "./components/IONavigation";

export const metadata: Metadata = {
	title: "PronotronIO",
	description: "PronotronIO Demos.",
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }> )
{
	return (
		<div className="flex flex-col">
			<div className="flex flex-col bg-slate-200 py-spacing-lg">
				<div className="container space-y-spacing-sm">
					<h1 className="text-2xl">PronotronIO Demo</h1>
					<p className="text-base">PronotronIO uses a single flattened <a className="underline" href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray#typedarray_objects" target="_blank" rel="noopener noreferrer">TypedArray</a> to store and update the data of IO nodes. Iterating over the TypedArray enables low-level access to memory. The package is not tied to scroll events; with every PronotronIO.handleScroll() request, it iterates over the table and processes only the relevant events (scrolling-down: bottom-in, top-out; scrolling-up: bottom-out, top-in). It logically activates the corresponding listener states when a state change occurs.</p>
					<p className="text-base">Since the package is not coupled with scroll events, any scrolling logic (e.g., smooth scrolling) can be implemented. Unlike the built-in <a className="underline" href="https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API" target="_blank" rel="noopener noreferrer">IntersectionObserver API</a>, which may miss targets during fast scrolling, PronotronIO ensures reliable event detection.</p>
					<p className="text-sm">Following demo executes scroll in RequestAnimationFrame and <strong>do not</strong> uses a <a className="underline" href="https://developer.mozilla.org/en-US/docs/Glossary/Throttle" target="_blank" rel="noopener noreferrer">throttle</a> function which would utilized in the production. Performance can be tracked with stats. Y positions will be changed by screen orientation (landscape, portrait)</p>
				</div>
			</div>
			<div className="bg-black/20 sticky top-0 z-50">
				<header className="container flex flex-row items-center justify-between py-spacing-base landscape:py-spacing-sm">
					<IONavigation />
				</header>
			</div>
			<div className="my-spacing-lg">
				<PronotronIOProvider>
					{ children }
				</PronotronIOProvider>
			</div>
		</div>
	);
}

