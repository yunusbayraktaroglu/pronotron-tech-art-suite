// "use client";

// import { useEffect } from "react";
// import { PronotronIOController } from "../core/PronotronIOController";

// export function usePronotronIOPageChange()
// {
// 	useEffect(() => {
// 		const controller = PronotronIOController.getInstance();

// 		/**
// 		 * If a page directly accessed, it runs before general setup
// 		 * 
// 		 * <Layout> (General Setup, set viewport, scroll events)
// 		 *    <Page> (Reset tracking events, set scroll 0)
// 		 *    <Page> (Reset tracking events, set scroll 0)
// 		 */
// 		if ( controller._viewport ){
// 			controller.reset();
// 			controller.handleScroll( window.scrollY );
// 		}
// 	}, []);

// 	return null;
// }