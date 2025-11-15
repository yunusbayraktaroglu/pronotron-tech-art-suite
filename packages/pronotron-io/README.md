# @pronotron/io

[![NPM Package][npm]][npm-url]
[![Build Size][build-size]][build-size-url]
[![Codecov][codecov-io]][codecov-url-io]

Reliable viewport tracking without missed targets, unlike the built-in [IntersectionObserver API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API).

Built on [NativeControlTable](https://www.npmjs.com/package/@pronotron/utils), it can safely be used for parallax effects, lazy loading, or tracking when any part of an element enters or exits the screen. Suitable for implementing any custom scrolling application.

### Usage

```typescript
import { PronotronIOVerticalObserver, PronotronIOHorizontalObserver } from '@pronotron/io';

export const pronotronIO = new PronotronIOVerticalObserver();

const getViewport = () => {
  if ( window.visualViewport ){
    return {
      height: window.visualViewport.height,
      offsetTop: window.visualViewport.offsetTop,
      scale: window.visualViewport.scale,
    };
  }
  return {
    height: window.innerHeight,
    offsetTop: 0,
    scale: 1,
  };
};
const onScroll = () => {
  pronotronIO.handleScroll( window.scrollY )
  setScrollDirection( pronotronIO.direction );
};
const onResize = () => {
  const vp = getViewport();
  pronotronIO.updateViewportLayout( vp.offsetTop, vp.offsetTop + vp.height );
  // Resizing updates layout. Needs recalculate node bounds
  pronotronIO.updatePositions( document.documentElement.scrollHeight );
  onScroll();
};

/**
 * TIP: It's better to use with a throttle function and RequestAnimationFrame API to optimize
 */
window.addEventListener( 'scroll', onScroll, { passive: true } );

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
  dispatch: {
    // Vertical events
    onTopEnter: () => console.log( "Top-enter" ),
    onTopExit: () => console.log( "Top-exit" ),
    onBottomEnter: () => console.log( "Bottom-enter" ),
    onBottomExit: {
      limit: 3,
      dispatch: () => console.log( "Bottom-exit" ),
    },
    // Returns -1 to +1 normalized position
    onInViewport: ( normalizedPosition: number ) => {
      console.log( normalizedPosition );
    },
    // On jumpy scrolls a node may bottom-enter then top-exit in same loop
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

[npm]: https://img.shields.io/npm/v/@pronotron/io
[npm-url]: https://www.npmjs.com/package/@pronotron/io
[build-size]: https://img.shields.io/bundlephobia/minzip/@pronotron/io
[build-size-url]: https://bundlephobia.com/result?p=@pronotron/io
[codecov-io]: https://codecov.io/gh/yunusbayraktaroglu/pronotron-tech-art-suite/branch/main/graph/badge.svg?flag=pronotron-io&precision=1
[codecov-url-io]: https://app.codecov.io/gh/yunusbayraktaroglu/pronotron-tech-art-suite?flags%5B0%5D=pronotron-io