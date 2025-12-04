"use client";

import { useState, createContext, useContext } from "react";

interface IPerformanceStatsContext {
	showStats: boolean;
	setShowStats: React.Dispatch<React.SetStateAction<boolean>>;
}

const PerformanceStatsContext = createContext<IPerformanceStatsContext>( null ! );

export function PerformanceStatsProvider( { children }: { children: React.ReactNode } )
{
	const [ showStats, setShowStats ] = useState( false );

	return (
		<PerformanceStatsContext value={ { showStats, setShowStats } }>
			{ children }
		</PerformanceStatsContext>
	);
}

export const usePerformanceStats = () => {
	const context = useContext( PerformanceStatsContext );
	if ( ! context ){
	  	throw new Error( "usePerformanceStats must be used within an PerformanceStatsContext" );
	}
	return context;
}
