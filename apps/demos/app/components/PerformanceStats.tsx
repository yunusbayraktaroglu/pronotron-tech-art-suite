"use client";

import { useEffect, useRef } from "react";
import { usePerformanceStats } from "../hooks/usePerformanceStats";

export class PronotronStatsPanel
{
	name: string;
	bg: string;
	fg: string;

	min = Infinity;
	max = 0;

	/** O to max limit will be visualized in related graph */
	maxLimit = 0;

	pixelRatio!: number;
	table: any;

	canvas!: HTMLCanvasElement;
	context!: CanvasRenderingContext2D;

	constructor( name: string, fg: string, bg: string )
	{
		this.name = name;
		this.fg = fg;
		this.bg = bg;
	}

	build()
	{
		//const PR = Math.round( window.devicePixelRatio || 1 );
		const PR = 1;
		this.pixelRatio = PR;
		this.table = {
			FONTSIZE: 9 * PR,
			WIDTH: 80 * PR,
			HEIGHT: 48 * PR,
			TEXT_X: 3 * PR,
			TEXT_Y: 2 * PR,
			GRAPH_X: 3 * PR, 
			GRAPH_Y: 15 * PR,
			GRAPH_WIDTH: 74 * PR, 
			GRAPH_HEIGHT: 30 * PR
		};
		this.createCanvas();
	}

	private createCanvas()
	{
		const name = this.name;
		const { FONTSIZE, WIDTH, HEIGHT, TEXT_X, TEXT_Y, GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT } = this.table;

		const canvas = document.createElement( 'canvas' );
		canvas.width = WIDTH;
		canvas.height = HEIGHT;
		canvas.style.cssText = `width:${ WIDTH }px;height:${ HEIGHT }px`;
	
		const context = canvas.getContext( '2d' )!;
		context.font = `bold ${ FONTSIZE }px Helvetica,Arial,sans-serif`;
		context.textBaseline = 'top';
	
		context.fillStyle = this.bg;
		context.fillRect( 0, 0, WIDTH, HEIGHT );
	
		context.fillStyle = this.fg;
		context.fillText( name, TEXT_X, TEXT_Y );
		context.fillRect( GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT );
	
		context.fillStyle = this.bg;
		context.globalAlpha = 0.9;
		context.fillRect( GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT );

		this.canvas = canvas;
		this.context = context;
	}

	update( value: number )
	{
		const PR = this.pixelRatio;
		const { WIDTH, HEIGHT, TEXT_X, TEXT_Y, GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT } = this.table;

		this.min = Math.min( this.min, value );
		this.max = Math.max( this.max, value );

		this.context.fillStyle = this.bg;
		this.context.globalAlpha = 1;
		this.context.fillRect( 0, 0, WIDTH, GRAPH_Y );
		
		this.context.fillStyle = this.fg;
		this.context.fillText( `${ Math.round( value ) } ${ this.name } (${ Math.round( this.min ) } - ${ Math.round( this.max ) })`, TEXT_X, TEXT_Y );

		this.context.drawImage( this.canvas, GRAPH_X + PR, GRAPH_Y, GRAPH_WIDTH - PR, GRAPH_HEIGHT, GRAPH_X, GRAPH_Y, GRAPH_WIDTH - PR, GRAPH_HEIGHT );

		this.context.fillRect( GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, GRAPH_HEIGHT );

		this.context.fillStyle = this.bg;
		this.context.globalAlpha = 0.75;
		this.context.fillRect( GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, Math.round( ( 1 - ( value / this.maxLimit ) ) * GRAPH_HEIGHT ) );
	}

	clearCanvas()
	{
		const { WIDTH, HEIGHT } = this.table;
		this.context.fillStyle = this.bg;
		this.context.globalAlpha = 1;
		this.context.fillRect( 0, 0, WIDTH, HEIGHT );
	}
}


export class PronotronStats
{
	ready = false;
	beginTime: number;
	prevTime: number;
	frames = 0;

	fps = new PronotronStatsPanel( 'FPS', '#0ff', '#002' );
	ms = new PronotronStatsPanel( 'MS', '#0f0', '#020' );
	mb = new PronotronStatsPanel( 'MB', '#f08', '#201' ); 

	constructor()
	{
		this.beginTime = performance.now();
		this.prevTime = this.beginTime;
	}

	build()
	{
		if ( this.ready ) return;
		this.fps.build();
		this.ms.build();
		this.mb.build();

		this.fps.maxLimit = 100;
		this.ms.maxLimit = 2;

		this.ready = true;
	}

	begin()
	{
		this.beginTime = performance.now();
	}
	
	end()
	{
		this.frames ++;

		const time = performance.now();

		this.ms.update( time - this.beginTime );
		this.ms.maxLimit = this.ms.max * 2;

		if ( time >= this.prevTime + 1000 ) {

			this.fps.update( ( this.frames * 1000 ) / ( time - this.prevTime ) );

			this.prevTime = time;
			this.frames = 0;

			// var memory = performance.memory;
			// this.mb.update( memory.usedJSHeapSize / 1048576, memory.jsHeapSizeLimit / 1048576 );

		}

		return time;
	}

	getPanels()
	{
		return [ this.fps.canvas, this.ms.canvas ]
	}

	resetPanels()
	{
		this.fps.clearCanvas();
		this.ms.clearCanvas();
		this.frames = 0;
	}
}

export const stats = new PronotronStats();

export function PronotronStatsComponent()
{
	const containerRef = useRef<HTMLDivElement>( null ! );
	const { showStats } = usePerformanceStats();

	useEffect(() => {

		stats.build();
		
		const container = containerRef.current;
		const panels = stats.getPanels();
		
		// Clear any previous canvases (for hot reload scenarios)
		while ( container.firstChild ){
			container.removeChild( container.firstChild );
		}
		
		panels.forEach( canvas => container.appendChild( canvas ) );

	}, []);

	return (
		<div 
			id="performance-stats" 
			className={ "fixed flex flex-col left-2 bottom-2 opacity-[1] z-[999] space-y-[1px]" + ( ! showStats ? " hidden" : "" ) }
			ref={ containerRef } 
		/>
	)
}
