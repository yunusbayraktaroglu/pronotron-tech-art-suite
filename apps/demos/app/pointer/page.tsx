"use client";

import { useEffect } from "react";
import { PronotronPointerProvider, usePointerContext, pointerSettings } from "./hooks/PointerProvider";

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
				<PointerView />
				<div className="bg-black/20 sticky top-0 z-50 py-spacing-sm">
					<div className="container flex flex-row justify-between">
						<PointerDebugger />
						<pre className="text-sm text-right">
							<p>idleTreshold: { pointerSettings.idleTreshold } s.</p>
							<p>movingDeltaLimit: { pointerSettings.movingDeltaLimit } px.</p>
							<p>holdTreshold: { pointerSettings.holdTreshold } s.</p>
						</pre>
					</div>
				</div>
			</PronotronPointerProvider>
			<div className="container flex flex-col my-spacing-lg">
				<div className="flex flex-col landscape:flex-row items-center justify-center h-[80vh] relative bg-slate-200 p-spacing-base gap-spacing-base">
					<a href="#" className="text-black text-xl leading-none hover:underline">Link</a>
					<button className="text-white text-xl py-3 px-spacing-lg leading-none rounded-full transition-colors bg-orange-600 hover:bg-orange-700">Button</button>
					<div data-holded className="holdable flex items-center justify-center bg-purple-500 text-white rounded-lg py-3 px-spacing-lg">
						<div className="pointer-events-none">
							<p className="text-xl">Holdable</p>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}

function PointerDebugger()
{
	const { pointer, pointerDelta, pointerState, pointerTargetInteractable } = usePointerContext();

	return (
		<div className="text-sm">
			<p>Pointer State: { pointerState }</p>
			<p>Interactable: { pointerTargetInteractable ? "TRUE" : "FALSE" }</p>
			<p>Position: { pointer.x.toFixed( 0 ) }, { pointer.y.toFixed( 0 ) }</p>
			<p>Delta: { pointerDelta.x.toFixed( 0 ) }, { pointerDelta.y.toFixed( 0 ) }</p>
		</div>
	);
}

function PointerView()
{
	const { pointer, pointerState, pointerTargetInteractable } = usePointerContext();

	return (
		<div 
			className="pointer"
			data-interactable={ pointerTargetInteractable }
			data-state={ pointerState }
			style={{ "--x": `${ pointer.x }px`, "--y": `${ pointer.y }px` } as React.CSSProperties }
		/>
	)
}