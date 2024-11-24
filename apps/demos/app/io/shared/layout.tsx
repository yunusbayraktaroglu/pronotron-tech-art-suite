"use client";

import { IODispatcher } from "../hooks/usePronotronIO";

export default function Layout({ children }: Readonly<{ children: React.ReactNode }> )
{
	return (
		<div className="flex flex-col my-spacing-base container">
			<h2 className="italic text-slate-400 text-center my-spacing-lg">See console...</h2>
			<IODispatcher 
				className='bg-blue-500 py-[50px] flex flex-col'
				offset={ 0 }
				dispatch={{
					onTopIn: () => console.log( "Shared node #0 Top-in" ),
					onTopOut: () => console.log( "Shared node #0 Top-out" ),
					onBottomOut: () => console.log( "Shared node #0 Bottom-out" ),
					onBottomIn: () => console.log( "Shared node #0 Bottom-in" ),
					onInViewport: ( normalizedPosition: number ) => {
						console.log( "Shared node #0 in viewport", normalizedPosition );
					},
					onFastForward: "execute_both"
				}}
				onRemoveNode={() => console.log( "Shared IO node #0 removed" )}
			>
				<p className="text-center">Shared node #0</p>
			</IODispatcher>

			{ children }
			
			<IODispatcher 
				className='bg-blue-500 py-[50px] flex flex-col'
				offset={ 0 }
				dispatch={{
					onTopIn: () => console.log( "Shared node #1 Top-in" ),
					onTopOut: () => console.log( "Shared node #1 Top-out" ),
					onBottomOut: () => console.log( "Shared node #1 Bottom-out" ),
					onBottomIn: () => console.log( "Shared node #1 Bottom-in" ),
					onInViewport: ( normalizedPosition: number ) => {
						console.log( "Shared node #1 in viewport", normalizedPosition );
					},
					onFastForward: "execute_both"
				}}
				onRemoveNode={() => console.log( "Shared IO node #1 removed" )}
			>
				<p  className="text-center">Shared node #1</p>
			</IODispatcher>
			
			<div className="flex h-[40vh] landscape:h-[20vh] relative"></div>
		</div>
	);
}

