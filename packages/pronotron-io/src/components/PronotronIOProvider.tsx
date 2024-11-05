// import { createContext, useEffect, useState } from 'react';
// import { PronotronIOController, PronotronIODispatcher } from "@pronotron/io";

// const MyLibraryContext = createContext( "down" );

// export function PronotronIOProvider({ children }: { children: React.ReactNode })
// {
// 	const [ scrollDirection, setScrollDirection ] = useState<"down" | "up">( "down" );

// 	useEffect(() => {
// 		//console.log( scrollDirection );
// 	}, [ scrollDirection ])

// 	useEffect(() => {

// 		const IO = PronotronIOController.getInstance();

// 		IO.setViewport({
// 			screenHeight: window.innerHeight,
// 			totalPageHeight: document.documentElement.scrollHeight
// 		});
		
// 		const scroll = () => {
// 			IO.handleScroll( window.scrollY )
// 			setScrollDirection( IO.direction );
// 		};
// 		const resize = () => {
// 			IO.setViewport({
// 				screenHeight: window.innerHeight,
// 				totalPageHeight: document.documentElement.scrollHeight
// 			});
// 			IO.handleScroll( window.scrollY );
// 			setScrollDirection( IO.direction );
// 		};

// 		// Execute manual scroll for jumpy start scrollY values
// 		scroll();

// 		//const onScroll = throttle( scroll, 250, { leading: false, trailing: true } );
// 		//const onResize = throttle( resize, 500, { leading: false, trailing: true } );
// 		const onScroll = scroll;
// 		const onResize = resize;

// 		window.addEventListener( 'scroll', onScroll );
// 		window.addEventListener( 'resize', onResize );

// 		//console.log( IO );

// 		return () => {
// 			window.removeEventListener( 'scroll', onScroll );
// 			window.removeEventListener( 'resize', onResize );
// 		}
		
// 	}, []);

// 	return (
// 		<MyLibraryContext.Provider value={ scrollDirection }>
// 			{ children }
// 		</MyLibraryContext.Provider>
// 	);
// }
