"use client";

import { useEffect, useState, useRef } from "react";
import { animationController } from "./hooks/PronotronAnimationProvider";

type TestScenario = {
	testCount: number;
	animationCount: number;
	timeType: "pausable" | "continious";
};

export default function AnimationControllerDemoPage()
{
	const [ testScenario, setTestScenario ] = useState<TestScenario>({
		testCount: 0,
		animationCount: 50,
		timeType: "pausable"
	});

	return (
		<div className="container">
			<AnimationStressTestForm runTestScenario={ setTestScenario } />
			<div className="grid grid-cols-4 gap-3 mt-spacing-base">
				{ Array.from({ length: testScenario.animationCount }).map(( item, index ) => (
					<SingleAnimation 
						key={ `${ testScenario.testCount }_${ index }` } 
						ID={ index }
						timeStyle={ testScenario.timeType } 
					/> 
				) )}
			</div>
		</div>
	);
}




interface TestFormProps {
	runTestScenario: ( scenario: TestScenario ) => void
};

function AnimationStressTestForm({ runTestScenario }: TestFormProps)
{
	const testCount = useRef( 0 );
	const [ testScenario, setTestScenario ] = useState<Omit<TestScenario, "testCount">>({
		animationCount: 1000,
		timeType: "pausable",
	});

	const handleInputChange = ( event: React.ChangeEvent<HTMLInputElement> ) => {
		const { name, value } = event.target;
		setTestScenario(( prev ) => ({
			...prev,
			[ name ]: Number( value ),
		}));
	};

	const handleSelectChange = ( event: React.ChangeEvent<HTMLSelectElement> ) => {
		const { name, value } = event.target;
		setTestScenario(( prev ) => ({
			...prev,
			[ name ]: value,
		}));
	};

	const startTest = () => {
		testCount.current += 1;
		runTestScenario({ testCount: testCount.current, ...testScenario });
	};

	return (
		<div className="form flex flex-col landscape:flex-row gap-5 bg-slate-200 p-spacing-lg mt-spacing-base rounded-lg">
			<fieldset>
				<label htmlFor="animationCount">Animation count</label>
				<input
					type="number"
					min={ 100 }
					name="animationCount"
					id="animationCount"
					value={ testScenario.animationCount }
					onChange={ handleInputChange }
				/>
			</fieldset>
			<fieldset>
				<label htmlFor="timeType">Time type</label>
				<select onChange={ handleSelectChange } name="timeType" id="timeType">
					<option value="pausable">Pausable</option>
					<option value="continious">Continious</option>
				</select>
			</fieldset>

			<button onClick={ startTest } className="block bg-green-500 hover:bg-green-400 px-4 py-2 rounded-full transition-colors ml-auto">Create Animations</button>

		</div>
	)
}







function SingleAnimation({ ID, timeStyle }: { ID: number, timeStyle: "pausable" | "continious" })
{
	const [ timeline, setTimeline ] = useState( 0 );
	const [ state, setState ] = useState( "running" );

	useEffect(() => {
		setState( "running" );
		animationController.addAnimation({
			id: `animation_${ ID }`,
			duration: 4.125 + ( ID + 1 ) / 20,
			onRender: ( currentTime, startTime, duration ) => {
				const timeline = ( currentTime - startTime ) / duration;
				setTimeline( Math.min( timeline, 1.0 ) );
			},
			onEnd: ( forced ) => {
				if ( forced ){
					console.log( "forcibly finished" )
				}
				if ( animationController.getAnimationCount() < 2 ){
					console.log( animationController );
				}
				setState( "end" );
			},
			timeStyle: timeStyle,
		});
		return () => animationController.removeAnimation( `animation_${ ID }`, true );
	}, []);

	return (
		<div className={ state === "running" ? "p-3 bg-orange-300" : "p-3 bg-green-300" }>
			<p>Animation: #{ ID }</p>
			<div className="w-full block bg-slate-900 h-[5px] origin-left" style={{ transform: `translate3d( 0, 0, 0 ) scaleX(${ timeline })`}} />
		</div>
	)
}





