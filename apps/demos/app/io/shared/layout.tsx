"use client";

import { IOLineDomManipulate } from "../components/IOLineDomManipulate";

export default function Layout({ children }: Readonly<{ children: React.ReactNode }> )
{
	return (
		<div className="flex flex-col">
			<div className="container">
				<p className="text-center">Red lines are shared between page-1 and page-2 and do not unmounts</p>
			</div>
			<div className="flex h-[40vh] landscape:h-[20vh] relative"></div>
			<IOLineDomManipulate id="Static line" topOut topIn color="red" />
			{ children }
			<div className="flex h-[40vh] landscape:h-[20vh] relative"></div>
			<IOLineDomManipulate id="Static line" topOut topIn color="red" />
		</div>
	);
}

