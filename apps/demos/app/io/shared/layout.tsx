"use client";

import { IODispatcher } from "../hooks/usePronotronIO";

export default function Layout({ children }: Readonly<{ children: React.ReactNode }> )
{
	return (
		<div className="flex flex-col">
			<div className="container">
				<p className="text-center">Red lines are shared between page-1 and page-2 and do not unmounts</p>
			</div>
			<div className="flex h-[40vh] landscape:h-[20vh] relative"></div>
			<IODispatcher 
				className='bg-blue-500 py-[50px] flex flex-col'
				offset={ 0 }
				dispatch={{
					onTopIn: () => console.log( "Static node #0 Top-in" ),
					onTopOut: () => console.log( "Static node #0 Top-out" ),
					onBottomOut: () => console.log( "Static node #0 Bottom-out" ),
					onBottomIn: () => console.log( "Static node #0 Bottom-in" ),
					onInViewport: ( normalizedPosition: number ) => {
						console.log( "Static node #0 in viewport", normalizedPosition );
					},
					//onFastForward: "execute_both"
				}}
			>
				<p className="text-center">Static node #0</p>
			</IODispatcher>

			{ children }
			
			<IODispatcher 
				className='bg-blue-500 py-[50px] flex flex-col'
				offset={ 0 }
				dispatch={{
					onTopIn: () => console.log( "Static node #1 Top-in" ),
					onTopOut: () => console.log( "Static node #1 Top-out" ),
					onBottomOut: () => console.log( "Static node #1 Bottom-out" ),
					onBottomIn: () => console.log( "Static node #1 Bottom-in" ),
					onInViewport: ( normalizedPosition: number ) => {
						console.log( "Static node #1 in viewport", normalizedPosition );
					},
					//onFastForward: "execute_both"
				}}
			>
				<p  className="text-center">Static node #1</p>
			</IODispatcher>
			<div className="flex h-[40vh] landscape:h-[20vh] relative"></div>
		</div>
	);
}

