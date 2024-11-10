"use client";

import React from "react";

import { IOLineDomManipulate } from "./components/IOLineDomManipulate";
import { IOLineLogger } from "./components/IOLineLogger";

const colors = [ "blue" , "red", "orange", "purple", "green" ] as Array<"blue" | "red" | "orange" | "purple" | "green">;

export default function Home()
{
	return (
		<>
			<div className="flex h-[40vh] landscape:h-[120vh] relative"></div>
			<IOLineDomManipulate id="Dom manipulator" color="blue" topIn topOut bottomIn bottomOut  />
			<div className="flex h-[40vh] landscape:h-[120vh] relative"></div>
			{/* <IOLineLogger id="Tracks bottom-in 3 times" color="purple" bottomIn retry={ 3 } />
			<div className="flex h-[40vh] landscape:h-[120vh] relative"></div>
			<IOLineDomManipulate id="Once" color="orange" topIn topOut bottomIn bottomOut />
			<div className="flex h-[40vh] landscape:h-[120vh] relative"></div> */}
		</>
	)
}