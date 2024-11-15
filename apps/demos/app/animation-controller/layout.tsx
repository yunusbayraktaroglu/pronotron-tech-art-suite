import type { Metadata } from "next";
import { PronotronAnimationControllerProvider } from "./hooks/PronotronAnimationProvider";

export const metadata: Metadata = {
	title: "Pronotron Animation Controller",
	description: "Pronotron Animation Controller Testing.",
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }> )
{
	return (
		<div className="flex flex-col">
			<div className="flex flex-col py-10 bg-slate-200">
				<div className="container">
					<h1 className="text-3xl mb-2">Pronotron Animation Controller Demo</h1>
					<p className="text-xl">Pronotron Animation Controller is an ultra tiny module, uses a single flatten <a className="underline" href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray#typedarray_objects" target="_blank" rel="noopener noreferrer">TypedArray</a> to hold/update the data of the animations. Tracks 2 types of time to stop ticking if screen is not focused. Iteration over TypedArray helps lower-level access to memory.</p>
					<div className="my-3">
						<p className="text-sm">onRender(): currentTime, startTime, duration which can be used to create every kind of animation.</p>
						<p className="text-sm">onEnd(): runs when animation end.</p>
					</div>
				</div>
			</div>
			<PronotronAnimationControllerProvider>
				{ children }
			</PronotronAnimationControllerProvider>
		</div>
	)
}