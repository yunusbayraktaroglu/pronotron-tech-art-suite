"use client";

import { useEffect, useState } from "react";
import { Expandable } from "@/app/components/Expandable";
import { PronotronPointerProvider, usePointerContext, pointerSettings } from "./hooks/PointerProvider";
import { PronotronPointerDataProvider, usePointerDataContext } from "./hooks/PointerDataProvider";

export default function PointerDemoPage()
{
	useEffect(() => {
		document.body.classList.add( "custom-cursor" );
		return () => {
			document.body.classList.remove( "custom-cursor" );
		}
	}, []);

	return (
		<>
			<PronotronPointerProvider>
				<PronotronPointerDataProvider>
					<PointerView />
					<div className="sticky top-0 z-50">
						<div className="bg-black/20">
							<Expandable title="Pointer Debug" expand={ true }>
								<PointerDebugger />
							</Expandable>
						</div>
						<div className="bg-black/10">
							<Expandable title="Pointer Settings" expand={ false }>
								<PointerSettings />
							</Expandable>
						</div>
					</div>
				</PronotronPointerDataProvider>
			</PronotronPointerProvider>
			<div className="container flex flex-col my-spacing-lg">
				<div className="flex flex-col landscape:flex-row items-center justify-center h-[80vh] relative bg-slate-200 p-spacing-base gap-spacing-base">
					<a href="#" className="text-black text-xl leading-none hover:underline">Link</a>
					<button className="text-white text-xl py-3 px-spacing-lg leading-none rounded-full transition-colors bg-orange-600 hover:bg-orange-700">Button</button>
					<div data-holded="0" className="holdable flex items-center justify-center bg-purple-500 text-white rounded-lg py-3 px-spacing-lg group">
						<div className="pointer-events-none select-none">
							<p className="text-xl group-data-[holded=1]:hidden">Holdable</p>
							<p className="text-xl group-data-[holded=0]:hidden">Holded</p>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}

function PointerSettings()
{
	const { pointerController } = usePointerContext();
	const [ ps, setPs ] = useState( pointerSettings );

	useEffect(() => {
		if ( pointerController.current ){
			pointerController.current.updateSettings( ps );
		}
	}, [ ps ]);

	// Handle change for numeric inputs
	const handleInputChange = ( event: React.ChangeEvent<HTMLInputElement> ) => {
		const { name, value } = event.target;
		setPs(( prev ) => ({
			...prev,
			[ name ]: Number( value ),
		}));
	};

	return (
		<div className="form grid gap-spacing-sm grid-rows-2 grid-cols-2 landscape:grid-cols-4 landscape:grid-rows-1">
			<fieldset>
				<label htmlFor="tapThreshold">Tap Threshold <small>(sec)</small></label>
				<input
					className="w-full"
					type="number"
					min={ 0.1 }
					step={ 0.1 }
					name="tapThreshold"
					id="tapThreshold"
					value={ ps.tapThreshold }
					onChange={ handleInputChange }
				/>
			</fieldset>
			<fieldset>
				<label htmlFor="idleThreshold">Idle Threshold <small>(sec)</small></label>
				<input
					className="w-full"
					type="number"
					min={ 0.1 }
					step={ 0.1 }
					name="idleThreshold"
					id="idleThreshold"
					value={ ps.idleThreshold }
					onChange={ handleInputChange }
				/>
			</fieldset>
			<fieldset>
				<label htmlFor="holdThreshold">Hold Threshold <small>(sec)</small></label>
				<input
					className="w-full"
					type="number"
					min={ 0.1 }
					step={ 0.1 }
					name="holdThreshold"
					id="holdThreshold"
					value={ ps.holdThreshold }
					onChange={ handleInputChange }
				/>
			</fieldset>
			<fieldset>
				<label htmlFor="movingDeltaLimit">Moving Delta <small>(px)</small></label>
				<input
					className="w-full"
					type="number"
					min={ 1 }
					step={ 1 }
					name="movingDeltaLimit"
					id="movingDeltaLimit"
					value={ ps.movingDeltaLimit }
					onChange={ handleInputChange }
				/>
			</fieldset>
		</div>
	)
}

function PointerDebugger()
{
	const { pointerPosition, pointerDelta, pointerState, pointerTargetInteractable } = usePointerDataContext();

	return (
		<div className="grid grid-cols-4 mt-spacing-xs gap-spacing-xs text-xs text-center">
			<span>State: <br/>{ pointerState }</span>
			<span>Interactable: <br/>{ pointerTargetInteractable ? "TRUE" : "FALSE" }</span>
			<span>Position: <br/>{ pointerPosition.x.toFixed( 0 ) }, { pointerPosition.y.toFixed( 0 ) }</span>
			<span>Delta: <br/>{ pointerDelta.x.toFixed( 0 ) }, { pointerDelta.y.toFixed( 0 ) }</span>
		</div>
	)
}

function PointerView()
{
	const { pointerPosition, pointerState, pointerTargetInteractable, pointerEasedPosition } = usePointerDataContext();

	return (
		<div 
			className="pointer"
			data-interactable={ pointerTargetInteractable }
			data-state={ pointerState }
			style={{ "--x": `${ pointerEasedPosition.x }px`, "--y": `${ pointerEasedPosition.y }px` } as React.CSSProperties }
		>
			<div className="pointer-inside" />
		</div>
	)
}