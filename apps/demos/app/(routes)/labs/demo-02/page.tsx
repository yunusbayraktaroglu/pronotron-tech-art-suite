"use client";

import './Cards.css';

import { useEffect, useCallback, useReducer } from "react";

import { usePerformanceStats } from "@/hooks/usePerformanceStats";
import { IODispatcher } from "@/(routes)/io/components/IODispatcher";

const CARD_COUNT = 3;

type ProgressState = number[];

function progressReducer( state: ProgressState, action: { index: number; value: number } ): ProgressState
{
	const next = [ ...state ];
	next[ action.index ] = action.value;

	return next;
}

export default function HomePage()
{
	const { setShowStats } = usePerformanceStats();

	useEffect( () => {
		setShowStats( false );
	}, [] );

	// Example starts
	const [ progress, dispatch ] = useReducer( progressReducer, Array( CARD_COUNT ).fill( 0 ) );

	const totalScrollProgress = progress.reduce( ( sum, p ) => sum + p, 0 ) / CARD_COUNT;

	const setProgress = useCallback( ( index: number, value: number ) => {
		dispatch( { index, value } );
	}, [] );

	return (
		<>
			<div className='h-screen flex items-center justify-center bg-slate-900 border-b-4 border-white border-dashed'>
				<div className="container max-w-[50%] font-sans text-center text-white space-y-spacing-base">
					<h1 className="text-xl">Stacking Cards</h1>
					<p className="animate-pulse">Scroll down ↓</p>
				</div>
			</div>

			<div className="min-h-[200vh]">
				<div
					className="h-screen bg-red-500 sticky top-0 flex items-center justify-center cards overflow-hidden"
					style={ { 
						'--total-cards': CARD_COUNT,
						'--scroll-progress': totalScrollProgress,
					} as React.CSSProperties }
				>
					<div className='container flex flex-col landscape:flex-row gap-spacing-base items-center'>
						<div className='w-3/5 space-y-spacing-base'>
							<h1>Which AirPods are right for you?</h1>
							<p>Lorem ipsum dolor si amet.</p>
						</div>
						<div className='w-2/3 landscape:w-1/3 relative flex items-start justify-center landscape:items-center'>
							{ progress.map( ( p, i ) => (
								<Card key={ i } id={ i } progress={ p }>
									<p>Card { i + 1 }</p>
								</Card>
							) ) }
						</div>
					</div>
				</div>
				<div className='space-y-[200px]'>
					{ Array.from( { length: CARD_COUNT - 1 }, ( _, i ) => (
						<IODispatcher
							key={ i }
							className='h-[200px]'
							dispatch={ {
								onScrollProgress: ( p ) => setProgress( i, p ),
								onTopExit: () => setProgress( i, 1.0 ),
								onBottomExit: () => setProgress( i, 0.0 ),
								onFastForward: "execute_last",
							} }
						/>
					) ) }
				</div>
			</div>

			<div className='container p-spacing-xl'>
				<p className='text-center'>page end</p>
			</div>
		</>
	);
}

function Card( { id, progress, children }: { id: number; progress: number; children?: React.ReactNode } )
{
	return (
		<div
			className="card w-full p-spacing-base aspect-square rounded-xl"
			style={ {
				'--card-progress': progress,
				'--card-id': id,
			} as React.CSSProperties }
		>
			{ children }
		</div>
	);
}