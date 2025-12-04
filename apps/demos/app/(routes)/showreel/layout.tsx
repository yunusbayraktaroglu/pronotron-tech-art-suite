import type { Metadata } from "next";
import { PronotronPointerProvider } from "../pointer/hooks/PointerProvider";
import { PronotronPointerDataProvider } from "../pointer/hooks/PointerDataProvider";
import { PointerView } from "../pointer/page";
import { PronotronIOProvider } from "../io/hooks/PronotronIOProvider";

export const metadata: Metadata = {
	title: "Pronotron Tech-Art Showreel",
	description: "An educational recreation of the Apple iPhone landing page using @pronotron tech-art packages. Built for demonstration purposes only.",
	robots: {
		googleBot: {
			noimageindex: true,
		},
	},
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }> )
{
	return (
		<PronotronPointerProvider>
			<PronotronPointerDataProvider>
				<PointerView/>
				<PronotronIOProvider>
					<div className="flex flex-col min-h-screen">
						{ children }
					</div>
				</PronotronIOProvider>
			</PronotronPointerDataProvider>
		</PronotronPointerProvider>
	)
}