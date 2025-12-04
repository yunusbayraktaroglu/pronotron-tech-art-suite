"use client";

import './ProductViewer.css';

import { useState, useRef, useCallback, useLayoutEffect } from "react";
import { ResizeObserver as Polyfill } from '@juggle/resize-observer';

import { PlusIcon } from "@/components/SiteSVG";
import { IODispatcher } from "../../io/components/IODispatcher";

const TABS = [
	{ 
		label: "Colors",
		content: "Choose from three bold finishes. iPhone 17 Pro shown in Cosmic Orange.",
		picture: <CameraControlPicture /> 
	},
	{ 
		label: "Aluminum unibody",
		content: "Aluminum unibody. Optimized for performance and battery. Aluminum alloy is remarkably light and has exceptional thermal conductivity.",
		picture: <UnibodyPicture /> 
	},
	{ 
		label: "Ceramic Shield",
		content: "Protects the back of iPhone 17 Pro, making it 4x more resistant to cracks.4 New Ceramic Shield 2 on the front has 3x better scratch resistance.",
		picture: <CeramicPicture /> 
	},
	{ 
		label: "Immersive pro display",
		content: "Ceramic Shield. Protects the back of iPhone 17 Pro, making it 4x more resistant to cracks.4 New Ceramic Shield 2 on the front has 3x better scratch resistance. Ceramic Shield. Protects the back of iPhone 17 Pro, making it 4x more resistant to cracks.4 New Ceramic Shield 2 on the front has 3x better scratch resistance. Ceramic Shield. Protects the back of iPhone 17 Pro, making it 4x more resistant to cracks.4 New Ceramic Shield 2 on the front has 3x better scratch resistance.",
		picture: <ProDisplayPicture /> 
	},
];

export function ProductViewer()
{
	const appRef = useRef<HTMLDivElement | null>( null );

	const lisRef = useRef<(HTMLLIElement | null)[]>( [] );
	const buttonsRef = useRef<(HTMLButtonElement | null)[]>( [] );
	const contentsRef = useRef<(HTMLDivElement | null)[]>( [] );

	const [ activeIndex, setActiveIndex ] = useState( -1 );

    const handleTabClick = useCallback( ( index: number ) => {

        const li = lisRef.current[ index ];
        const button = buttonsRef.current[ index ];
        const content = contentsRef.current[ index ];

        if ( li && button && content ){

            // Measure the specific button width
            const buttonWidth = button.getBoundingClientRect().width;
            
            // Measure the content's natural full height
            const contentHeight = content.scrollHeight;

            // Set these variables explicitly on the invidual element
            li.style.setProperty( "--target-width", `${ buttonWidth }px` );
            li.style.setProperty( "--target-height", `${ contentHeight }px` );
        }

        // Add activeIndex class after setting CSS variables
		setTimeout( () => setActiveIndex( index ), 0 );

    }, [] );

	useLayoutEffect( () => {

		const appWrapper = appRef.current;

		if ( ! appWrapper || activeIndex < 0 ) return;

		const ResizeObserver = window.ResizeObserver || Polyfill;
		const ro = new ResizeObserver( () => {
			handleTabClick( activeIndex );
		} );
		ro.observe( appWrapper );

		return () => {
			ro.disconnect();
		}
		
	}, [ activeIndex ] );

	return (
		<div className="relative h-screen overflow-hidden bg-black flex items-center">

			{/* IMAGES PART */}
			<div className="controls-media absolute top-0 left-0 w-full h-full" ref={ appRef }>
				{ TABS.map( ( tab, index ) => (
					<div key={ index } data-isactive={ activeIndex === index } data-index={ index } className="product-picture absolute">
						{ tab.picture }
					</div>
				) ) }
			</div>

			{/* LIST PART */}
			<div className="container py-spacing-xl relative text-white">

				<div className="controls z-50 [--app-expanded-width:70vw] landscape:[--app-expanded-width:25vw] [--app-padding:20px] landscape:[--app-padding:30px]">
					<ul className="control-group space-y-spacing-xs" role="tablist">
						{ TABS.map( ( tabData, index ) => (
							<Tab
								key={ index }
								isActive={ activeIndex === index } 
								index={ index }
								lisRef={ lisRef }
								buttonsRef={ buttonsRef }
								contentsRef={ contentsRef }
								tabData={ tabData }
								setActiveIndex={ handleTabClick }
							/> 
						) ) }
					</ul>
				</div>

				{/* 1px IO DISPATCHER */}
				<IODispatcher 
					key="IO_CONTROLLER"
					aria-hidden
					className="h-[1px] -mb-spacing-xl mt-spacing-xl"
					dispatch={ {
						onEnter: () => handleTabClick( 0 ),
						onExit: () => handleTabClick( -1 ),
						onFastForward: "skip_both"
					} }
				/>

			</div>
			
		</div>
	)
}

interface TabProps {
	lisRef: React.RefObject<(HTMLLIElement | null)[]>;
	buttonsRef: React.RefObject<(HTMLButtonElement | null)[]>;
	contentsRef: React.RefObject<(HTMLDivElement | null)[]>;
	isActive: boolean;
	index: number;
	tabData: {
		label: string;
		content: string;
	};
	setActiveIndex: ( index: number ) => void;
};

function Tab( { lisRef, buttonsRef, contentsRef, isActive, index, tabData, setActiveIndex }: TabProps )
{
	return (
		<li 
			ref={ ( el ) => { 
				lisRef.current[ index ] = el; 
			} }
			className={ `control-item${ isActive ? ' expanded' : ''  }` }
		>
			<div className="control-item-bg" style={ { transform: 'matrix(1, 0, 0, 1, 0, 0)' } } aria-hidden />

			<button
				ref={ ( el ) => { 
					buttonsRef.current[ index ] = el; 
				} }
				onClick={ () => setActiveIndex( index ) }
				className='control-item-open'
				tabIndex={ isActive ? -1 : 0 }
				aria-expanded={ isActive ? 'true' : 'false' }
			>
				<span className="control-item-label" style={ { transform: 'matrix(1, 0, 0, 1, 0, 0)' } }>
					<PlusIcon />
					{ tabData.label }
				</span>
			</button>

			<div 
				className="control-item-content" 
				aria-hidden={ isActive ? 'false' : 'true' }
			>
				<div className="control-item-content-mask">
					<div 
						ref={ ( el ) => { 
							contentsRef.current[ index ] = el; 
						} }
						className="control-item-content-inner"
					>
						<p className="text-sm landscape:text-base">
							<strong>{ tabData.label }.</strong> { tabData.content }
						</p>
					</div>
				</div>
			</div>
		</li>
	)
}

function UnibodyPicture()
{
	return (
		<picture>
			<source srcSet="unibody__eublzdgtajo2_small.jpg, unibody__eublzdgtajo2_small_2x.jpg 2x" media="(max-width:734px)" />
			<source srcSet="unibody__eublzdgtajo2_medium.jpg, unibody__eublzdgtajo2_medium_2x.jpg 2x" media="(max-width:1068px)" />
			<source srcSet="unibody__eublzdgtajo2_large.jpg, unibody__eublzdgtajo2_large_2x.jpg 2x" media="(min-width:0px)" />
			<img src="unibody__eublzdgtajo2_large.jpg" alt="" className="w-full" />
		</picture>
	)
}

function CameraControlPicture()
{
	return (
		<picture>
			<source srcSet="camera_control__cy5kilwa0kwi_small.jpg, camera_control__cy5kilwa0kwi_small_2x.jpg 2x" media="(max-width:734px)" />
			<source srcSet="camera_control__cy5kilwa0kwi_medium.jpg, camera_control__cy5kilwa0kwi_medium_2x.jpg 2x" media="(max-width:1068px)" />
			<source srcSet="camera_control__cy5kilwa0kwi_large.jpg, camera_control__cy5kilwa0kwi_large_2x.jpg 2x" media="(min-width:0px)" />
			<img src="camera_control__cy5kilwa0kwi_large.jpg" alt="" className="w-full" />
		</picture>
	)
}

function CeramicPicture() {
	return (
		<picture>
			<source srcSet="ceramic_shield__de0653vp43cm_small.jpg, ceramic_shield__de0653vp43cm_small_2x.jpg 2x" media="(max-width:734px)" />
			<source srcSet="ceramic_shield__de0653vp43cm_medium.jpg, ceramic_shield__de0653vp43cm_medium_2x.jpg 2x" media="(max-width:1068px)" />
			<source srcSet="ceramic_shield__de0653vp43cm_large.jpg, ceramic_shield__de0653vp43cm_large_2x.jpg 2x" media="(min-width:0px)" />
			<img src="ceramic_shield__de0653vp43cm_large.jpg" alt="" className="w-full" />
		</picture>
	)
}

function ProDisplayPicture()
{
	return (
		<picture>
			<source srcSet="pro_display__c0jmzc5emcae_small.jpg, pro_display__c0jmzc5emcae_small_2x.jpg 2x" media="(max-width:734px)" />
			<source srcSet="pro_display__c0jmzc5emcae_medium.jpg, pro_display__c0jmzc5emcae_medium_2x.jpg 2x" media="(max-width:1068px)" />
			<source srcSet="pro_display__c0jmzc5emcae_large.jpg, pro_display__c0jmzc5emcae_large_2x.jpg 2x" media="(min-width:0px)" />
			<img src="pro_display__c0jmzc5emcae_large.jpg" alt="" className="w-full" />
		</picture>
	)
}
