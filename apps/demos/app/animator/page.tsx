"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePerformanceStats } from "../hooks/usePerformanceStats";
import { SingleAnimation } from "./components/SingleAnimation";

type TestScenario = {
	testCount: number;
	animationCount: number;
	autoPause: boolean;
	delay: number;
};

export default function AnimatorDemoPage()
{
	const { setShowStats } = usePerformanceStats();
	const [ testScenario, setTestScenario ] = useState<TestScenario>({
		testCount: 0,
		animationCount: 50,
		autoPause: true,
		delay: 0
	});

	useEffect(() => {
		setShowStats( true );
	}, []);

	return (
		<div className="container">
			<AnimationStressTestForm runTestScenario={ setTestScenario } />
			<div className="grid grid-cols-3 landscape:grid-cols-4 gap-spacing-xs my-spacing-base">
				{ Array.from({ length: testScenario.animationCount }).map(( _item, index ) => (
					<SingleAnimation 
						key={ `${ testScenario.testCount }_${ index }` } 
						id={ `${ index }` }
						autoPause={ testScenario.autoPause }
						delay={ testScenario.delay }
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
		autoPause: true,
		delay: 0
	});

	const handleInputChange = useCallback(( event: React.ChangeEvent<HTMLInputElement> ) => {
		const { name, value } = event.target;
		setTestScenario(( prev ) => ({
			...prev,
			[ name ]: Number( value ),
		}));
	}, []);

	const handleSelectChange = useCallback(( event: React.ChangeEvent<HTMLSelectElement> ) => {
		const { name, value } = event.target;
		setTestScenario(( prev ) => ({
			...prev,
			[ name ]: value,
		}));
	}, []);

	const handleCheckboxChange = useCallback(( event: React.ChangeEvent<HTMLInputElement> ) => {
		const { name, checked } = event.target;
		setTestScenario(( prev ) => ({
			...prev,
			[ name ]: checked,
		}));
	}, []);

	const startTest = useCallback(() => {
		testCount.current += 1;
		runTestScenario({ testCount: testCount.current, ...testScenario });
	}, [ testScenario ]);

	return (
		<div className="form flex flex-col landscape:flex-row items-start gap-5 bg-slate-200 p-spacing-lg mt-spacing-base rounded-lg">
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
				<label htmlFor="autoPause">Auto pause</label>
				<input 
					type="checkbox"
					name="autoPause"
					id="autoPause"
					checked={ testScenario.autoPause }
					onChange={ handleCheckboxChange }
				/>
			</fieldset>
			<fieldset>
				<label htmlFor="delay">Delay</label>
				<input
					type="number"
					min={ 0 }
					step={ 0.1 }
					name="delay"
					id="delay"
					value={ testScenario.delay }
					onChange={ handleInputChange }
				/>
			</fieldset>
			<button onClick={ startTest } className="block text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-full transition-colors landscape:ml-auto">Create Animations</button>
		</div>
	)
}