import type { Metadata } from "next";
import { PackageBadges } from "@/app/components/PackageBadges";
import { PronotronIOProvider } from "./hooks/PronotronIOProvider";
import { IONavigation } from "./components/IONavigation";
import { PageData } from "./components/PageData";

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
					<PackageBadges packageName="@pronotron/io" />
					<h1 className="text-2xl">PronotronIO Demo</h1>
					<p className="text-base">Reliable viewport tracking without missed targets, unlike the built-in <a className="underline" href="https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API" target="_blank" rel="noopener noreferrer">IntersectionObserver API</a>.</p>
					<p className="text-base">PronotronIO uses a single flattened <a className="underline" href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray#typedarray_objects" target="_blank" rel="noopener noreferrer">TypedArray</a> to store and update the data of IO nodes.The package is not tied to scroll events; with every PronotronIO.handleScroll() request, it iterates over the table and processes events.</p>
					<p className="text-base">Since the package is not coupled with scroll events, any scrolling logic (e.g., smooth scrolling) can be implemented.</p>
					<p className="text-sm">Following demo executes scroll in RequestAnimationFrame and <strong>do not</strong> uses a <a className="underline" href="https://developer.mozilla.org/en-US/docs/Glossary/Throttle" target="_blank" rel="noopener noreferrer">throttle</a> function which would utilized in the production. Performance can be tracked with stats.</p>
				</div>
			</div>
			<PronotronIOProvider>
				<div className="sticky top-0 z-50">
					<div className="bg-black/20">
						<IONavigation />
					</div>
					<div className="bg-black/10">
						<PageData />
					</div>
				</div>
				<div className="my-spacing-lg">
					{ children }
				</div>
			</PronotronIOProvider>
		</div>
	);
}

