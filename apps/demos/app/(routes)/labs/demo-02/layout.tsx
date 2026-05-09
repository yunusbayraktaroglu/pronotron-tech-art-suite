import type { Metadata } from "next";

import { PronotronIOProvider } from "@/(routes)/io/hooks/PronotronIOProvider";

export const metadata: Metadata = {
	title: "Pronotron Tech-Art Card Stacking",
	description: "Cards stacking example.",
	robots: {
		googleBot: {
			noimageindex: true,
		},
	},
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }> )
{
	return (
		<PronotronIOProvider>
			<div className="flex flex-col min-h-screen">
				{ children }
			</div>
		</PronotronIOProvider>
	)
}