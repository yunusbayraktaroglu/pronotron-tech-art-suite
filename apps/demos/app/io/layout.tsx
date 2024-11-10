import { PronotronIOProvider } from "./hooks/PronotronIOProvider";
import { IONavigation } from "./components/IONavigation";

export default function Layout({ children }: Readonly<{ children: React.ReactNode }> )
{
	return (
		<div className="flex flex-col">
			<div className="flex flex-col py-10 bg-slate-200">
				<div className="container">
					<h1 className="text-3xl mb-2">PronotronIO Demo</h1>
					<p className="text-xl">PronotronIO uses a single flatten <a className="underline" href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray#typedarray_objects" target="_blank" rel="noopener noreferrer">TypedArray</a> to hold/update the data of IO nodes. Every scroll iterates over it and controls only possible events (scrolling-down: bottom-in, top-out, scrolling-up: bottom-out, top-in) and logicly activates related listen states when state is changed. Iteration over TypedArray helps lower-level access to memory.</p>
					<p className="text-xl">The built-in <a className="underline" href="https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API" target="_blank" rel="noopener noreferrer">IntersectionObserver API</a> may miss the targets in fast scrolls. But this does not.</p>
					<p className="my-3">Following demo executes scroll in RequestAnimationFrame and <strong>do not</strong> uses a <a className="underline" href="https://developer.mozilla.org/en-US/docs/Glossary/Throttle" target="_blank" rel="noopener noreferrer">throttle</a> function which would utilized in the production. Performance can be tracked with stats.</p>
					<div className="my-3">
						<p className="text-sm">Static: Will not be unmount while navigation</p>
						<p className="text-sm">Dynamic: Will be unmount and auto removed from IO</p>
						<p className="text-sm">Y positions will be changed by screen orientation (landscape, portrait)</p>
					</div>
				</div>
			</div>
			<div className="bg-black/25 sticky top-0 z-50">
				<header className="container flex flex-row items-center justify-between py-4">
					<IONavigation />
				</header>
			</div>
			<div className="flex h-[40vh] landscape:h-[20vh] relative"></div>
			<PronotronIOProvider>
				{ children }
			</PronotronIOProvider>
		</div>
	);
}

