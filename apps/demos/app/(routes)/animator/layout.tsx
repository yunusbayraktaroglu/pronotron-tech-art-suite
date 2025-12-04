import type { Metadata } from "next";
import { PronotronAnimatorProvider } from "./hooks/PronotronAnimatorProvider";

export const metadata: Metadata = {
	title: "Animator",
	description: "Pronotron Animator Testing.",
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }> )
{
	return (
		<div className="flex flex-col">
			<div className="flex flex-col py-spacing-lg bg-slate-200">
				<div className="container space-y-spacing-sm">
					<a href={ `https://www.npmjs.com/package/@pronotron/utils` } target="_blank" className="flex">
						<img src={ `https://img.shields.io/npm/v/@pronotron/utils` } />
					</a>
					<h1 className="text-2xl">Pronotron Animator Demo</h1>
					<p className="text-base">Provides a lightweight yet powerful system for managing large-scale animations with high efficiency. Built on top of <strong>@pronotron/utils</strong> NativeControlTable and Clock, it delivers per-frame normalized timeline data (ranging from 0.0 to 1.0) for every active animation, enabling developers to design smooth, custom animation logic with minimal overhead.</p>
				</div>
			</div>
			<PronotronAnimatorProvider>
				{ children }
			</PronotronAnimatorProvider>
		</div>
	)
}