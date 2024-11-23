"use client";

import { useRef, useState } from "react";
import { IODispatchOptions } from '@pronotron/io';
import { IODispatcher } from "../hooks/usePronotronIO";

type TestScenario = {
	testCount: number;
	inViewport: boolean,
	ioCount: number;
	topIn: boolean;
	topOut: boolean;
	bottomIn: boolean;
	bottomOut: boolean;
	dispatchType: "modify_dom" | "console_log" | "never",
	onFastForward: IODispatchOptions[ "onFastForward" ],
};

export default function StressTestPage()
{
	const [ testScenario, setTestScenario ] = useState<TestScenario | false>( false );

	return (
		<div className="container mt-spacing-base">

			<div className="bg-slate-200 p-spacing-lg rounded-lg">
				{ testScenario ? (
					<p className="text-green-800 mb-5">Created { testScenario.ioCount } node. Scroll down to see effects. Check starts for performance.</p>
				) : null}
				<TestForm runTestScenario={ setTestScenario } />
			</div>

			{ testScenario ? ( 
				Array.from({ length: testScenario.ioCount }).map(( item, index ) => {

					const { dispatchType, inViewport, topIn, topOut, bottomIn, bottomOut, onFastForward } = testScenario;

					switch( dispatchType ){
						case "modify_dom": 
							return (
								<DomManipulator 
									key={ `${ testScenario.testCount }_${ index }` }
									index={ index } 
									inViewport={ inViewport }
									topIn={ topIn } 
									topOut={ topOut }
									bottomIn={ bottomIn } 
									bottomOut={ bottomOut }
									onFastForward={ onFastForward } 
								/>
							)
						case "console_log": 
							return (
								<IODispatcher
									key={ `${ testScenario.testCount }_${ index }` }
									className={ `bg-green-500 my-[120vh]` }
									offset={ 0 }
									//@ts-expect-error - At least 1 event is required
									dispatch={ logDispatcher({ index, inViewport, topIn, topOut, bottomIn, bottomOut, onFastForward }) }
								>
									<p className="text-center">{ index }</p>
								</IODispatcher>
							)
						case "never": 
							return (
								<IODispatcher 
									key={ `${ testScenario.testCount }_${ index }` }
									className={ `bg-green-500 my-[120vh]` }
									offset={ 0 }
									//@ts-expect-error - At least 1 event is required
									dispatch={ emptyDispatcher({ inViewport, topIn, topOut, bottomIn, bottomOut, onFastForward }) }
								>
									<p className="text-center">{ index }</p>
								</IODispatcher>
							);
					}
				}) 
			) : null }

		</div>
	);
}

interface TestFormProps {
	runTestScenario: ( scenario: TestScenario ) => void
};

function TestForm({ runTestScenario }: TestFormProps)
{
	const testCount = useRef( 0 );

	const [ warning, setWarning ] = useState( "" );
	const [ testScenario, setTestScenario ] = useState<Omit<TestScenario, "testCount">>({
		ioCount: 1000,
		dispatchType: "modify_dom",
		inViewport: false,
		topIn: true,
		topOut: false,
		bottomIn: false,
		bottomOut: false,
		onFastForward: "skip_both",
	});

	// Handle change for numeric input
	const handleInputChange = ( event: React.ChangeEvent<HTMLInputElement> ) => {
		const { name, value } = event.target;
		setTestScenario(( prev ) => ({
			...prev,
			[ name ]: Number( value ),
		}));
	};

	// Handle change for checkbox inputs
	const handleCheckboxChange = ( event: React.ChangeEvent<HTMLInputElement> ) => {
		const { name, checked } = event.target;
		setTestScenario(( prev ) => ({
			...prev,
			[ name ]: checked,
		}));
	};

	// Handle change for numeric input
	const handleSelectChange = ( event: React.ChangeEvent<HTMLSelectElement> ) => {
		const { name, value } = event.target;
		setTestScenario(( prev ) => ({
			...prev,
			[ name ]: value,
		}));
	};

	const startTest = () => {
		const { inViewport, topIn, topOut, bottomIn, bottomOut } = testScenario;
		if ( ! inViewport && ! topIn && ! topOut && ! bottomIn && ! bottomOut ){
			setWarning( "Please select at least 1 event" );
			return;
		}
		testCount.current += 1;
		runTestScenario({ testCount: testCount.current, ...testScenario });
		setWarning( "" );
	};

	return (
		<div className="form">

			{ warning && <p className="text-red-500 mb-spacing-sm">{ warning }</p> }
			
			<fieldset className="flex flex-col landscape:flex-row justify-between items-start gap-5">

				<fieldset className="flex flex-col landscape:flex-row gap-5">

					<fieldset>
						<label htmlFor="ioCount">IO count</label>
						<input
							type="number"
							min={ 100 }
							name="ioCount"
							id="ioCount"
							value={ testScenario.ioCount }
							onChange={ handleInputChange }
						/>
					</fieldset>

					<fieldset>
						<label htmlFor="dispatch-type">Select dispatch type</label>
						<select onChange={ handleSelectChange } name="dispatchType" id="dispatch-type">
							<option value="modify_dom">Modify dom</option>
							<option value="console_log">Console log</option>
							<option value="never">Never (useful for iteration speed)</option>
						</select>
					</fieldset>

					<fieldset>
						<label htmlFor="fast-forward">Select fast-forward type</label>
						<select onChange={ handleSelectChange } name="onFastForward" id="fast-forward">
							<option value="skip_both">Skip both (default)</option>
							<option value="execute_both">Execute both events</option>
							<option value="execute_last">Execute last event</option>
						</select>
					</fieldset>

					<fieldset>
						<label>Track events</label>
						<fieldset className="checkbox">
							<fieldset>
								<input
									type="checkbox"
									name="inViewport"
									id="in-viewport"
									checked={ testScenario.inViewport }
									onChange={ handleCheckboxChange }
								/>
								<label htmlFor="in-viewport">In viewport</label>
							</fieldset>
							<fieldset>
								<input
									type="checkbox"
									name="topIn"
									id="top-in"
									checked={ testScenario.topIn }
									onChange={ handleCheckboxChange }
								/>
								<label htmlFor="top-in">Top-in</label>
							</fieldset>
							<fieldset>
								<input
									type="checkbox"
									name="topOut"
									id="top-out"
									checked={ testScenario.topOut }
									onChange={ handleCheckboxChange }
								/>
								<label htmlFor="top-out">Top-out</label>
							</fieldset>
							<fieldset>
								<input
									type="checkbox"
									name="bottomIn"
									id="bottom-in"
									checked={ testScenario.bottomIn }
									onChange={ handleCheckboxChange }
								/>
								<label htmlFor="bottom-in">Bottom-in</label>
							</fieldset>
							<fieldset>
								<input
									type="checkbox"
									name="bottomOut"
									id="bottom-out"
									checked={ testScenario.bottomOut }
									onChange={ handleCheckboxChange }
								/>
								<label htmlFor="bottom-out">Bottom-out</label>
							</fieldset>
						</fieldset>
					</fieldset>

				</fieldset>

				<button onClick={ startTest } className="block bg-green-500 hover:bg-green-400 px-4 py-2 rounded-full transition-colors">Create IO nodes</button>

			</fieldset>

		</div>
	)
}

interface logDispatcherProps {
	index: number,
	inViewport: boolean;
	topIn: boolean;
	topOut: boolean;
	bottomIn: boolean;
	bottomOut: boolean;
	onFastForward: IODispatchOptions[ "onFastForward" ];
}

function logDispatcher({ index, inViewport, topIn, topOut, bottomIn, bottomOut, onFastForward }: logDispatcherProps )
{
	return {
		...( inViewport && { onInViewport: ( normalizedPosition: number ) => console.log( `${ index }: Normalized position: ${ normalizedPosition }` ) } ),
		...( topIn && { onTopIn: () => console.log( `${ index }: top-in` ) } ),
		...( topOut && { onTopOut: () => console.log( `${ index }: top-out` ) } ),
		...( bottomIn && { onBottomIn: () => console.log( `${ index }: bottom-in` ) } ),
		...( bottomOut && { onBottomOut: () => console.log( `${ index }: bottom-out` ) } ),
		onFastForward
	}
}

function emptyDispatcher({ inViewport, topIn, topOut, bottomIn, bottomOut, onFastForward }: logDispatcherProps )
{
	return {
		...( inViewport && { onInViewport: () => {} } ),
		...( topIn && { onTopIn: () => {} } ),
		...( topOut && { onTopOut: () => {} } ),
		...( bottomIn && { onBottomIn: () => {} } ),
		...( bottomOut && { onBottomOut: () => {} } ),
		onFastForward
	}
}

function DomManipulator({ index, inViewport, topIn, topOut, bottomIn, bottomOut, onFastForward }: logDispatcherProps )
{
	const [ pos, setPos ] = useState<string | number>( "untracked" );
	const [ state, setState ] = useState<false | string>( false );

	return (
		<div className="my-[120vh] text-center">
			<p><strong>#{ index }:</strong> Last recorded event: { state ? state : null }</p>
			<IODispatcher 
				className={ `bg-green-500 my-5 py-2` }
				offset={ 0 }
				//@ts-expect-error - At least 1 event is required
				dispatch={{
					...( inViewport === true && { onInViewport: ( normalizedPosition: number ) => setPos( normalizedPosition ) } ),
					...( topIn === true && { onTopIn: () => setState( "Top-in" ) } ),
					...( topOut === true && { onTopOut: () => setState( "Top-out" ) } ),
					...( bottomIn === true && { onBottomIn: () => setState( "Bottom-in" ) } ),
					...( bottomOut === true && { onBottomOut: () => setState( "Bottom-out" ) } ),
					onFastForward
				}}
			>
				<p>Normalized Position: { pos }</p>
			</IODispatcher>
			<p><strong>#{ index }:</strong> Last recorded event: { state ? state : null }</p>
		</div>
	)
}
