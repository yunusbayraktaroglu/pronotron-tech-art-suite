import type { Metadata } from "next";
import { PronotronAnimatorProvider } from "./hooks/PronotronAnimatorProvider";

export const metadata: Metadata = {
	title: "Pronotron Animation Controller",
	description: "Pronotron Animation Controller Testing.",
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }> )
{
	return (
		<div className="flex flex-col">
			<div className="flex flex-col py-spacing-lg bg-slate-200">
				<div className="container space-y-spacing-sm">
					<h1 className="text-2xl">Pronotron Animator Demo</h1>
					<p className="text-base">Built on @pronotron/utils NativeControlTable and Clock, it provides per-frame normalized timeline data (ranging from 0 to 1), enabling developers to create any kind of animation.</p>
				</div>
			</div>
			<PronotronAnimatorProvider>
				{ children }
			</PronotronAnimatorProvider>
		</div>
	)
}