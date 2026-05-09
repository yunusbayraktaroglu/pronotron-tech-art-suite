"use client";

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";

const TABS = [
    { label: "200 mm" },
    { label: "100 mm and long item" },
    { label: "48 mm" },
    { label: "35 mm" }
];

export function Tabnav()
{
	const wrapperRef = useRef<HTMLDivElement>( null ! );
	const varsRef = useRef<HTMLDivElement>( null ! );
    const itemsRef = useRef<(HTMLButtonElement | null)[]>( [] );

	// 1. We need state to track the active tab
    const [ activeIndex, setActiveIndex ] = useState( 0 );

	// This function calculates positions and updates CSS variables directly
    // WITHOUT triggering a React re-render
    const updateIndicator = useCallback( () => {

        const currentButton = itemsRef.current[ activeIndex ];
        const wrapper = wrapperRef.current;
		const varswrapper = varsRef.current;

        if ( currentButton && wrapper && varswrapper ){

            const wrapperRect = wrapper.getBoundingClientRect();
            const { width, left } = currentButton.getBoundingClientRect();

            varswrapper.style.setProperty( "--tabnav-indicator-width", `${ width }px`);
            varswrapper.style.setProperty( "--tabnav-indicator-start", `${ left - wrapperRect.left }px`);

        }

    }, [ activeIndex ] );

	// useLayoutEffect prevents visual flickering by calculating 
    // before the browser paints the screen
    useLayoutEffect( () => {

        updateIndicator();
        
        // Add resize listener to keep slider correct on window resize
        window.addEventListener( "resize", updateIndicator );
        return () => window.removeEventListener( "resize", updateIndicator );

    }, [ activeIndex, updateIndicator ]);

	return (
		<div className="tabnav-wrapper mx-auto" ref={ wrapperRef }>
			<div className="tabnav tabnav-pill" ref={ varsRef }>
				<div className="tabnav-platter">
					<div className="tabnav-mask">
						<ul className="tabnav-items" role="tablist">
							{ TABS.map( ( tab, index ) => {
								const isActive = activeIndex === index;
								return (
									<li
										key={ index }
										className={ `tabnav-item${ isActive ? " tabnav-item-active" : "" }` }
										role="presentation"
										data-gallery-index={ index }
									>
										<button
											// Save ref to calculate slider position
											ref={ ( el ) => { itemsRef.current[ index ] = el; } }
											onClick={ () => setActiveIndex( index ) }
											className="tabnav-link"
											role="tab"
											aria-selected={ isActive }
											tabIndex={ isActive ? 0 : -1 }
										>
											<div className="tabnav-label">{ tab.label }</div>
										</button>
									</li>
								);
							})}
						</ul>
					</div>
					<div className="tabnav-indicator" />
					<Paddles />
				</div>
			</div>
		</div>
	)
}


function Paddles()
{
	return (
		<div className="tabnav-paddles">
			<button className="tabnav-paddle tabnav-paddle-left" aria-label="Previous item" tabIndex={ -1 }>
				<svg width="7px" height="12px" viewBox="0 0 7 12" xmlns="http://www.w3.org/2000/svg">
					<g transform="translate(-23.5, -32)">
						<g transform="translate(6, 16)">
							<path fill="currentcolor" d="M22.6745939,27.6865883 L17.8045148,22.7298827 C17.3970998,22.314824 17.3984999,21.6470593 17.808715,21.234824 L22.7088952,16.3091774 C23.1184103,15.8962362 23.7848348,15.8969421 24.1936498,16.311295 C24.6031649,16.7256479 24.6017648,17.3962361 24.1915498,17.8084714 L20.0326968,21.9887063 L24.1656488,26.1957648 C24.5737638,26.6115295 24.5716637,27.2814118 24.1593486,27.6929412 C23.954941,27.8976471 23.6875312,28 23.4201214,28 C23.1499114,28 22.8797015,27.8955294 22.6745939,27.6865883 Z">
							</path>
						</g>
					</g>
				</svg>
			</button>
			<button className="tabnav-paddle tabnav-paddle-right" aria-label="Next item" tabIndex={ -1 }>
				<svg width="7px" height="12px" viewBox="0 0 7 12" xmlns="http://www.w3.org/2000/svg">
					<g transform="translate(-41.5, -32)">
						<g transform="translate(22, 16)">
							<path fill="currentcolor" d="M20.5798786,28 C20.3124688,28 20.045059,27.8976471 19.8406514,27.6929412 C19.4283363,27.2814118 19.4262362,26.6115295 19.8343512,26.1957648 L23.9673032,21.9887063 L19.8084502,17.8084714 C19.3982352,17.3962361 19.3968351,16.7256479 19.8063502,16.311295 C20.2151652,15.8969421 20.8815897,15.8962362 21.2911048,16.3091774 L26.191285,21.234824 C26.6015001,21.6470593 26.6029002,22.314824 26.1954852,22.7298827 L21.3254061,27.6865883 C21.1202985,27.8955294 20.8500886,28 20.5798786,28">
							</path>
						</g>
					</g>
				</svg>
			</button>
		</div>
	)
}