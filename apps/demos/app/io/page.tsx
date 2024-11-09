"use client";

import React from "react";

import { IOLineDomManipulate } from "./components/IOLineDomManipulate";

const colors = [ "blue" , "red", "orange", "purple", "green" ] as Array<"blue" | "red" | "orange" | "purple" | "green">;

export default function Home()
{
	return Array.from({ length: 10 }).map(( item, index ) => (
		<React.Fragment key={ index }>
			<div className="flex h-[40vh] landscape:h-[120vh] relative"></div>
			<IOLineDomManipulate id={ index } topIn topOut bottomIn bottomOut color={ colors[ index % 5 ]} />
		</React.Fragment>
	)) 
}