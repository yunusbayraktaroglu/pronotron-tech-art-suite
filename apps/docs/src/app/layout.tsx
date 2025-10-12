import type { Metadata } from "next";

export const metadata: Metadata = {
	title: {
		default: "Documents | Pronotron Tech-Art Suite",
		template: '%s | Pronotron Tech-Art Suite',
	},
	description: "Pronotron Tech-Art Suite documents.",
	authors: [
		{ 
			name: "Yunus Bayraktaroglu",
			url: "https://www.linkedin.com/in/yunusbayraktaroglu",
		}
	],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }> )
{
	return (
		<html lang="en">
			<body>{ children }</body>
		</html>
	);
}
