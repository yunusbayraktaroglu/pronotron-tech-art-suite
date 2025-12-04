"use client";

import { useCallback, useMemo, useState } from "react";
import { IOVerticalOptions } from '@pronotron/io';
import { useForm } from "@/hooks/useForm";

import { IODispatcher } from "../components/IODispatcher";

// Collect all dispatchable events from type, exclude Fast-forward
type PossibleEvents = Required<Omit<IOVerticalOptions[ "dispatch" ], "onFastForward">>;

// EventName -> boolean
type EventSelection = Record<keyof PossibleEvents, boolean>;

// TestScenario configuration data
type TestScenario = EventSelection & {
	ioNodeCount: number;
	dispatchType: "modify_dom" | "console_log" | "never";
	onFastForward: IOVerticalOptions[ "dispatch" ][ "onFastForward" ];
};

const ALL_EVENTS: EventSelection = {
	// Direction agnostic events
	onEnter: true,
	onExit: true,
	onScrollProgress: true,
	onInViewport: true,
	// Directional events
	onBottomEnter: true,
	onBottomExit: true,
	onTopEnter: true,
	onTopExit: true,
};

// All the possible events as array
const ALL_EVENTS_LIST = Object.keys( ALL_EVENTS ) as [ keyof PossibleEvents ];

export default function StressTestPage()
{
	const [ testScenario, setTestScenario ] = useState<TestScenario | false>( false );

	return (
		<div className="container mb-spacing-3xl">
			<div className="bg-slate-200 p-spacing-lg rounded-lg">
				{ testScenario && <p className="text-green-800 mb-5">Created { testScenario.ioNodeCount } node. Scroll down to see effects. Check starts for performance.</p> }
				<TestScenarioForm runTestScenario={ setTestScenario } />
			</div>
			{ testScenario && <TestComponentCreator testScenario={ testScenario } /> }
		</div>
	);
}

interface TestFormProps {
	runTestScenario: ( scenario: TestScenario ) => void;
};

function TestScenarioForm({ runTestScenario }: TestFormProps)
{
	const {
		values, 
        handleInputChange, 
        handleCheckboxChange, 
        handleSelectChange, 
	} = useForm<TestScenario>({ ioNodeCount: 1000, dispatchType: "modify_dom", onFastForward: "skip_both", ...ALL_EVENTS });

	const handleSubmit = useCallback( ( event: React.FormEvent ) => {
        event.preventDefault();
		runTestScenario( values );
    }, [ values ] );

	const disabled = useMemo( () => {
		return ALL_EVENTS_LIST.every( eventName => values[ eventName ] === false );
	}, [ values ] );

	return (
		<div className="form">

			<fieldset className="flex flex-col landscape:flex-row justify-between items-start gap-5">

				<fieldset className="grid grid-rows-1 grid-cols-1 landscape:grid-cols-4 landscape:grid-rows-1 gap-5">

					<fieldset>
						<label htmlFor="ioNodeCount">IO Node count</label>
						<input
							className="w-full"
							type="number"
							min={ 100 }
							name="ioNodeCount"
							id="ioNodeCount"
							value={ values.ioNodeCount }
							onChange={ handleInputChange }
						/>
					</fieldset>

					<fieldset>
						<label htmlFor="dispatch-type">Dispatch type</label>
						<select onChange={ handleSelectChange } name="dispatchType" id="dispatch-type" className="w-full">
							<option value="modify_dom">Modify dom</option>
							<option value="console_log">Console log</option>
							<option value="never">Never (useful for iteration speed)</option>
						</select>
					</fieldset>

					<fieldset>
						<label htmlFor="fast-forward">Fast-forward behavior</label>
						<select onChange={ handleSelectChange } name="onFastForward" id="fast-forward" className="w-full">
							<option value="skip_both">Skip both (default)</option>
							<option value="execute_both">Execute both events</option>
							<option value="execute_last">Execute last event</option>
						</select>
					</fieldset>

					<fieldset>
						<label>Track events</label>
						<fieldset className="checkbox">
							{ ALL_EVENTS_LIST.map( eventName => (
								<fieldset key={ `${ eventName }` }>
									<input
										type="checkbox"
										name={ eventName }
										id={ `${ eventName }_id` }
										checked={ values[ eventName ] }
										onChange={ handleCheckboxChange }
									/>
									<label htmlFor={ `${ eventName }_id` }>{ eventName }</label>
								</fieldset>
							) ) }
						</fieldset>
					</fieldset>

				</fieldset>

				<button 
					aria-disabled={ disabled }
					disabled={ disabled } 
					onClick={ handleSubmit } 
					className="block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full transition-colors disabled:bg-slate-400"
				>Create IO nodes</button>

			</fieldset>

		</div>
	)
}

interface TestComponentCreatorProps {
	testScenario: TestScenario;
};

function TestComponentCreator({ testScenario }: TestComponentCreatorProps)
{
	const { ioNodeCount, dispatchType, ...ioNodeData } = testScenario;

	switch ( dispatchType )
	{
		case 'modify_dom': {
			return Array.from({ length: ioNodeCount }).map( ( item, index ) => (
				<DomManipulator 
					key={ `${ index }` }
					index={ index }
					{ ...ioNodeData }
				/>
			))
		};

		case 'console_log': {
			return Array.from({ length: ioNodeCount }).map( ( item, index ) => (
				<IODispatcher 
					key={ `${ index }` }
					className={ `bg-green-500 my-[120vh]` }
					offset={ 0 }
					dispatch={ {
						onFastForward: ioNodeData.onFastForward, 
						...getLogDispatcher( index, ioNodeData )
					} }
				>
					<p className="text-center py-spacing-lg">{ index }</p>
				</IODispatcher>
			) );
		};

		case 'never': {
			break;
		}
	}
}

type DomManipulatorProps2 = EventSelection & {
	index: number;
	onFastForward: IOVerticalOptions[ "dispatch" ][ "onFastForward" ];
};

function DomManipulator( { index, onFastForward, ...events }: DomManipulatorProps2 )
{
	const [ position, setPosition ] = useState( 0 );
	const [ scrollProgress, setScrollProgress ] = useState( 0 );
	const [ state, setState ] = useState<false | string>( false );

	const dispatch = useMemo(() => {
		return getDispatcher( events, { setScrollProgress, setPosition, setState } );
	}, [] );

	return (
		<div className="my-[120vh] text-center">
			<p><strong>#{ index }:</strong> Last recorded event: { state ? state : null }</p>
			<IODispatcher 
				className={ `bg-green-500 my-spacing-sm py-spacing-xl` }
				offset={ 0 }
				dispatch={ {
					onFastForward,
					...dispatch
				} }
			>
				<p>Scroll Progress: { scrollProgress.toFixed( 2 ) }</p>
				<p>Normalized Position: { position.toFixed( 2 ) }</p>
			</IODispatcher>
			<p><strong>#{ index }:</strong> Last recorded event: { state ? state : null }</p>
		</div>
	)
}



type DispatcherFunctions = {
    setScrollProgress: ( position: number ) => void;
    setPosition: ( normalizedPosition: number ) => void;
    setState: ( message: string ) => void;
};

/**
 * Returns dispatch object that modifies react states
 * 
 * @param eventSelection
 * @param param1 
 * @returns 
 */
function getDispatcher( eventSelection: EventSelection, { setScrollProgress, setPosition, setState }: DispatcherFunctions )
{
    // Define the full map of possible event handlers.
    const eventHandlersMap: PossibleEvents = {
        onScrollProgress: ( position: number ) => setScrollProgress( position ),
        onInViewport: ( normalizedPosition: number ) => setPosition( normalizedPosition ),
        onEnter: () => setState( "Enter!" ),
        onExit: () => setState( "Exit!" ),
        onTopEnter: () => setState( "Top-enter!" ),
        onTopExit: () => setState( "Top-exit!" ),
        onBottomEnter: () => setState( "Bottom-enter!" ),
        onBottomExit: () => setState( "Bottom-exit!" ),
    };

    const dispatcher = {} as typeof eventHandlersMap;

    // Iterate over the input props (EventSelection).
    for ( const [ key, isEnabled ] of Object.entries( eventSelection ) as [ keyof EventSelection, boolean ][] ){
        
        if ( isEnabled ){
            const handler = eventHandlersMap[ key as keyof typeof eventHandlersMap ];
            Object.assign( dispatcher, { [ key ]: handler });
        }

    }

    return dispatcher;
}

/**
 * Returns dispatch object that logs
 * 
 * @param nodeIndex 
 * @param eventSelection 
 * @returns 
 */
function getLogDispatcher( nodeIndex: number, eventSelection: EventSelection )
{
    // Define the full map of possible event handlers.
    const eventHandlersMap: PossibleEvents = {
        onScrollProgress: ( position: number ) => console.log( `Node ${ nodeIndex } scroll-progress: ${ position }` ),
        onInViewport: ( normalizedPosition: number ) => console.log( `Node ${ nodeIndex } viewport-position: ${ normalizedPosition }` ),
        onEnter: () => console.log( "Enter!" ),
        onExit: () => console.log( "Exit!" ),
        onTopEnter: () => console.log( "Top-enter!" ),
        onTopExit: () => console.log( "Top-exit!" ),
        onBottomEnter: () => console.log( "Bottom-enter!" ),
        onBottomExit: () => console.log( "Bottom-exit!" ),
    };

    const dispatcher = {} as typeof eventHandlersMap;

    // Iterate over the input props (EventSelection).
    for ( const [ key, isEnabled ] of Object.entries( eventSelection ) as [ keyof EventSelection, boolean ][] ){
        
        if ( isEnabled ){
            const handler = eventHandlersMap[ key as keyof typeof eventHandlersMap ];
            Object.assign( dispatcher, { [ key ]: handler });
        }

    }

    return dispatcher;
}