import type { Metadata } from "next";
import { PackageBadges } from "@/app/components/PackageBadges";

export const metadata: Metadata = {
	title: "Pronotron Pointer",
	description: "Pronotron Pointer demo page.",
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }> )
{
	return (
		<div className="flex flex-col">
			<div className="flex flex-col py-spacing-lg bg-slate-200">
				<div className="container space-y-spacing-sm">
					<PackageBadges packageName="@pronotron/pointer" />
					<h1 className="text-2xl">Pronotron Pointer Demo</h1>
					<p className="text-base">Tracks mouse and touch interactions with custom states such as holding, tapping, idling, interacting, moving out, and moving in, enabling enhanced interaction control.</p>
					<p className="text-sm">See the console for details.</p>
				</div>
			</div>
			{ children }
		</div>
	)
}