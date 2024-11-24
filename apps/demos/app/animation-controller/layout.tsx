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
			<div className="flex flex-col py-spacing-lg bg-slate-200">
				<div className="container space-y-spacing-sm">
					<h1 className="text-3xl">Pronotron Pointer Demo</h1>
					<p className="text-xl">Built on @pronotron/utils NativeControlTable and Clock, it provides per-frame normalized timeline data (ranging from 0 to 1), enabling developers to create any kind of animation.</p>
				</div>
			</div>
			<PronotronAnimationControllerProvider>
				{ children }
			</PronotronAnimationControllerProvider>
		</div>
	)
}