# @pronotron/io

Reliable viewport tracking without missed targets, unlike the default [IntersectionObserver API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API). Built on @native-control-table, it can safely be used for parallax effects, lazy loading, or tracking when any part of an element enters or exits the screen. Suitable for implementing any custom scrolling application.

### Setup

```typescript
import { PronotronIOVertical } from '@pronotron/io';

const pronotronIO = new PronotronIOVertical();

const onScroll = () => {
	pronotronIO.handleScroll( window.scrollY )
	setScrollDirection( pronotronIO.direction );
};

const onResize = () => {
	pronotronIO.setViewport( window.innerHeight, document.documentElement.scrollHeight );
	pronotronIO.setLastScrollY( 0 );
	pronotronIO.handleScroll( window.scrollY );
	setScrollDirection( pronotronIO.direction );
};

/**
 * TIP: It's better to use with a throttle function and RequestAnimationFrame API to optimize 
 */
window.addEventListener( 'scroll', scroll, { passive: true } );

/**
 * (x) window.addEventListener( 'resize', onResize );
 * 
 * - Do not use window.resize event, it's firing every scroll in mobile devices because of topbar behavior.
 * - May use ResizeObserverPolyfill from '@juggle/resize-observer' to support old devices.
 */
const ResizeObserver = window.ResizeObserver | ResizeObserverPolyfill;
const ro = new ResizeObserver(( entries, observer ) => {
	onResize();
});

ro.observe( document.body );
```

### Observing

```typescript
const element = document.getElementByID( "test" );

const nodeID = pronotronIO.addNode({
	ref: element,
	dispatch={
		onTopIn: () => console.log( "Top-in" ),
		onTopOut: () => console.log( "Top-out" ),
		onBottomIn: () => console.log( "Bottom-in" ),
		onBottomOut: () => console.log( "Bottom-out" ),
		// Returns -1 to +1 normalized position
		onInViewport: ( normalizedPosition: number ) => {
			console.log( normalizedPosition );
		},
		// On jumpy scrolls a node may bottom-in then top-out in same loop
		onFastForward: "execute_both" // "skip_both" | "execute_last"
	},
	offset: 10, // increases bounds in pixels
	onRemoveNode: () => element.dataset.ioActive = "0",
	getBounds: () => {
		const { top, bottom } = element.getBoundingClientRect();
		return { 
			start: top + window.scrollY, 
			end: bottom + window.scrollY 
		};
	},
});
```

## TODO
- Refactor to be able to run with horizontal scrolls
- Execute logic for initial in-viewport nodes