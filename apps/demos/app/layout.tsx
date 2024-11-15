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
	title: {
		default: "Pronotron Web Packages",
		template: '%s | Pronotron Web Packages',
	},
	description: "Demo setups for Pronotron Web Packages",
	authors: [
		{ name: "Yunus Bayraktaroglu" }
	],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }> )
{
	return (
		<html lang="en">
			<body className={ `${ geistSans.variable } ${ geistMono.variable } antialiased` }>
				<header className="container">
					<nav className="flex flex-row space-x-2 p-spacing-sm">
						<Link href="/">Home</Link>
						<Link href="/documents">Documents</Link>
						<a className="!ml-auto" target="_blank" href="https://github.com/yunusbayraktaroglu/pronotron-web-libraries">Github</a>
					</nav>
				</header>
				<PronotronStatsComponent />
				{ children }
			</body>
		</html>
	);
}
