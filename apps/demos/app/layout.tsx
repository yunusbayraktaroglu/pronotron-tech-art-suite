import "./globals.css";

import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";

import { PerformanceStatsProvider } from "./hooks/usePerformanceStats";
import { PronotronStatsComponent } from "./components/PerformanceStats";
import { SiteSVG, GithubIcon } from "./components/SiteSVG";

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
		default: "Pronotron Tech-Art Suite",
		template: '%s | Pronotron Tech-Art Suite',
	},
	description: "Demo setups for Pronotron Tech-Art Suite",
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
			<body className={ `${ geistSans.variable } ${ geistMono.variable } antialiased` }>
				<SiteSVG />
				<header className="container">
					<nav className="flex flex-row -mx-spacing-sm">
						<Link href="/" className="p-spacing-sm hover:underline">Home</Link>
						<Link href="/documents" className="p-spacing-sm hover:underline">Documents</Link>
						<a className="ml-auto flex flex-row align-center p-spacing-sm" target="_blank" href="https://github.com/yunusbayraktaroglu/pronotron-tech-art-suite">
							Github<GithubIcon fill="black" stroke="none" className="ml-1" />
						</a>
					</nav>
				</header>
				<PerformanceStatsProvider>
					<PronotronStatsComponent />
					{ children }
				</PerformanceStatsProvider>
			</body>
		</html>
	);
}
