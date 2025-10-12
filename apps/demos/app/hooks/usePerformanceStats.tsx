"use client";

import { useState, createContext, useContext } from "react";

interface IPerformanceStatsContext {
	showStats: boolean;
	setShowStats: React.Dispatch<React.SetStateAction<boolean>>;
}

const PerformanceStatsContext = createContext<IPerformanceStatsContext>( null ! );

export function PerformanceStatsProvider({ children }: { children: React.ReactNode })
{
	const [ showStats, setShowStats ] = useState( false );

	return (
		<PerformanceStatsContext.Provider value={{ showStats, setShowStats }}>
			{ children }
		</PerformanceStatsContext.Provider>
	);
}

export const usePerformanceStats = () => {
	const context = useContext( PerformanceStatsContext );
	if ( ! context ){
	  	throw new Error( "useAppTicker must be used within an AppTickerProvider" );
	}
	return context;
}
