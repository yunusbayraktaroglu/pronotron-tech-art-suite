"use client";

import React from "react";

import { IOLineLogger } from "../../components/IOLineLogger";

const colors = [ "blue" , "red", "orange", "purple", "green" ] as Array<"blue" | "red" | "orange" | "purple" | "green">;

export default function Home()
{
	return Array.from({ length: 10 }).map(( item, index ) => (
		<React.Fragment key={ index }>
			<div className="flex h-[40vh] landscape:h-[120vh] relative"></div>
			<IOLineLogger id={ index } topIn topOut bottomIn bottomOut color={ colors[ index % colors.length ] } />
		</React.Fragment>
	)) 
}