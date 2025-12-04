"use client";

import './components/Tabnav.css';

import { useEffect } from "react";
import Link from 'next/link';

import { usePerformanceStats } from "@/hooks/usePerformanceStats";

import { ProductViewer } from "./components/ProductViewer";
import { HardwareZoom } from './components/HardwareZoom';

export default function HomePage()
{
	const { setShowStats } = usePerformanceStats();
	
	useEffect( () => {
		setShowStats( false );
	}, [] );

	return (
		<>
			<div className='h-screen flex items-center justify-center bg-slate-900 border-b-4 border-white border-dashed'>
				<div className="container max-w-[50%] font-sans text-center text-white space-y-spacing-xl">
					<h1 className="text-xl">Components Recreated:</h1>
					<div className='text-slate-500'>
						<p>Iphone 17 Landing Page</p>
						<Link href="https://www.apple.com/iphone-17-pro" target='_blank' className='text-link'>see original</Link>
					</div>
					<p>Scroll down ↓</p>
				</div>
			</div>
			<HardwareZoom />
			<div className='z-50 bg-black'>
				<div className='container px-spacing-base landscape:max-w-[50%]'>
					<p className='text-base text-center -mt-spacing-xl font-sans text-slate-400'>
						From home movies to Hollywood productions, iPhone 17 Pro is up to any challenge. With <strong className='text-white'>more pro video features than ever</strong> — like enhanced video stabilization, cinema-grade specs, and compatibility with industry-standard workflows — iPhone 17 Pro puts powerful filmmaking tools within reach, wherever you need them.
					</p>
				</div>
			</div>
			<div className='h-screen z-50 relative'>
				<ProductViewer />
			</div>
		</>
	)
}