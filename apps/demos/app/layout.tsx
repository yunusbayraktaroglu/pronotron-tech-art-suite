import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import { PronotronStatsComponent } from "./components/PerformanceStats";

import "./globals.css";

const geistSans = localFont({
	src: "./fonts/GeistVF.woff",
	variable: "--font-geist-sans",
	weight: "100 900",
});
const geistMono = localFont({
	src: "./fonts/GeistMonoVF.woff",
	variable: "--font-geist-mono",
	weight: "100 900",
});

export const metadata: Metadata = {
	title: "Pronotron Web Packages | Demos",
	description: "Demo setups for Pronotron Web Packages",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }> )
{
	return (
		<html lang="en">
			<body className={ `${ geistSans.variable } ${ geistMono.variable } antialiased` }>
				<header className="container flex space-x-2 p-3 mb-3 border-b">
					<Link href="/">Home</Link>
					<Link href="/documents">Documents</Link>
					<Link href="/github">Github</Link>
				</header>
				<PronotronStatsComponent />
				{ children }
			</body>
		</html>
	);
}
