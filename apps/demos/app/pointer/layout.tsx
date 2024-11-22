import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Pronotron Pointer",
	description: "Pronotron Pointer testing page.",
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }> )
{
	return (
		<div className="flex flex-col">
			<div className="flex flex-col py-10 bg-slate-200">
				<div className="container">
					<h1 className="text-3xl mb-2">Pronotron Pointer Demo</h1>
					<p className="text-xl">Pronotron pointer tracks enchanced interaction with "hold", "tap" events. Tracks 2 types of time to stop ticking if screen is not focused. Iteration over TypedArray helps lower-level access to memory.</p>
					<div className="my-3">
						<p className="text-sm">onRender(): currentTime, startTime, duration which can be used to create every kind of animation.</p>
						<p className="text-sm">onEnd(): runs when animation end.</p>
					</div>
				</div>
			</div>
			{ children }
		</div>
	)
}