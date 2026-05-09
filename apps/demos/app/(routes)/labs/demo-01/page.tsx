"use client";

import { useState, useEffect } from "react";

import { usePerformanceStats } from "@/hooks/usePerformanceStats";
import { IODispatcher } from "@/(routes)/io/components/IODispatcher";
import { ArtDirectionImage } from "../components/ArtDirectionImage";

export default function HomePage()
{
	const { setShowStats } = usePerformanceStats();
	const [ readState, setReadState ] = useState( 0 );

	useEffect( () => {
		setShowStats( false );
	}, [] );

	return (
		<>
			<div className='h-screen flex items-center justify-center bg-slate-900 border-b-4 border-white border-dashed'>
				<div className="container max-w-[50%] font-sans text-center text-white space-y-spacing-base">
					<h1 className="text-xl">Read Tracker</h1>
					<p className="animate-pulse">Scroll down ↓</p>
				</div>
			</div>
			<ReadState state={ readState } />

			<div className="py-spacing-3xl">
				<IODispatcher 
					className="w-full container"
					dispatch={ {
						onScrollProgress: ( scrollProgress ) => setReadState( state => Math.max( state, scrollProgress ) ),
						onTopExit: () => setReadState( state => Math.max( state, 1.0 ) ),
						onBottomExit: () => setReadState( state => Math.max( state, 0.0 ) ),
						onFastForward: "execute_last"
					} }
				>
					<div className="space-y-spacing-lg">
						<Paragraph1 />
						<Paragraph2 />
						<Paragraph3 />
					</div>
				</IODispatcher>
				
				<div className="container mt-spacing-xl">
					<hr />
				</div>

			</div>


		</>
	)
}



function ReadState( { state }: { state: number } )
{
	const color = state < 1 ? 'bg-orange-500' : 'bg-green-500';

	return (
		<div className="container fixed left-0 right-0 border bottom-spacing-sm rounded-2xl overflow-hidden bg-white/30 backdrop-blur-sm">
			<div className="p-spacing-xs">
				<p className="text-xs text-right leading-none">You've read: { Math.round( state * 100 ) }%</p>
			</div>
			<div 
				className={ `w-full block absolute inset-0 -z-10 bg-green-500 origin-left ${ color }` }  
				style={ { 
					transform: `translate3d( 0, 0, 0 ) scaleX(${ state })` 
				} } 
			/>
		</div>
	)
}

function Paragraph1()
{
	return (
		<div className="space-y-spacing-sm">
			<h1 className="mb-spacing-base">Quis dignissimos eum</h1>
			<p>
				Lorem ipsum dolor sit amet. Et totam harum et voluptatem quae qui ducimus asperiores ad molestiae itaque in nisi pariatur. Sed dicta possimus ut consequatur sunt nam deleniti repellat. Et dolore necessitatibus nam Quis dignissimos eum aliquid excepturi. Sed delectus voluptas quo obcaecati architecto At corporis expedita ut nemo facilis est illo esse. Est blanditiis enim ut modi quas et inventore eligendi aut praesentium enim sed animi aliquam non voluptatem inventore. Est accusamus accusamus et accusantium odio aut iure labore ab dolores corrupti nam fugit eaque non minima inventore ea repellendus vitae. Et consequatur architecto ad minus eligendi aut dicta amet est dolorum cupiditate vel enim voluptatum eos eligendi doloribus et similique internos.
			</p>
			<p>
				Non doloremque praesentium ut veritatis voluptatibus et cupiditate tenetur et dolor quam est distinctio voluptates ex doloremque architecto. Cum omnis quibusdam aut natus saepe aut dolorem quibusdam sit voluptas error non error doloribus. A galisum quidem qui rerum incidunt non quia molestias.
			</p>
		</div>
	)
}

function Paragraph2()
{
	return (
		<div className="space-y-spacing-sm">
			<div className="float-left max-w-[50%] mr-spacing-base"><ArtDirectionImage /></div>
			<p>
				Aut earum cupiditate sit quidem inventore qui omnis molestiae. Ea rerum voluptatum aut reprehenderit magnam id voluptas omnis qui labore assumenda? Ea consectetur accusantium ut rerum numquam 33 natus explicabo in quod galisum qui quisquam beatae quo soluta provident. Est ducimus possimus ut perspiciatis labore ut dolorum enim sit minima aperiam nam excepturi atque. Eum deserunt esse aut maiores aperiam At earum fuga sit molestiae modi. A itaque quia ab quas inventore a eveniet suscipit. Qui sapiente enim aut minima galisum ut aliquid fuga rem quibusdam enim ad voluptate reiciendis eum soluta nihil non esse nostrum!  Nam voluptate praesentium ab neque alias qui aspernatur consequatur ut odio porro et exercitationem voluptatum. Qui eveniet expedita ut earum iste et distinctio quaerat. Et eaque nisi hic porro rerum ad quidem ipsum ut sunt neque ab enim dolorum ea blanditiis assumenda. Et reiciendis ullam id enim voluptatem et eius nihil et voluptatem asperiores ut autem internos.
			</p>
		</div>
	)
}

function Paragraph3()
{
	return (
		<div className="space-y-spacing-sm">
			<h1 className="mb-spacing-base">Non voluptatem nobis</h1>
			<p>
				Id sequi omnis et nihil molestiae eos velit maxime quo quidem ullam est cumque voluptatem. Ad officiis quia et ullam veritatis aut tempora nulla cum assumenda minus!
			</p>
			<p>
				Et mollitia galisum vel ipsum tempore ut delectus accusamus qui odit laborum ut harum eaque aut laudantium assumenda et facere dolorem. Ea maiores voluptates et voluptas consequuntur qui nostrum voluptatem et commodi voluptas ut rerum soluta. Et quibusdam enim et nisi eius ut sint velit qui voluptas voluptas. Qui similique harum nam saepe doloribus aut harum quisquam 33 exercitationem quibusdam ut enim nemo ex numquam nulla. Est amet rerum quo vitae inventore aut tempora numquam. Quo voluptas minima vel distinctio dolorum cum cupiditate tempore. Sit unde incidunt cum voluptatem veniam aut corrupti aperiam aut numquam placeat et labore animi qui illo vitae. Et facilis illo qui dolores quia et Quis illum aut dolore tempore id dolorum asperiores! Non sunt deserunt et possimus dolorem ut doloremque ipsum. Et omnis suscipit et enim praesentium id cupiditate dolores At sint totam 33 eius officiis. Et harum rerum aut inventore perspiciatis ab fuga deleniti est nulla consectetur hic nihil quis sed voluptatem illum. 33 recusandae facilis vel rerum magni et deleniti dolorem ut saepe voluptatum.
			</p>
		</div>
	)
}