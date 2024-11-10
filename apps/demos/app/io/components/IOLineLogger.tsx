import { IODispatcher } from "@/app/io/hooks/IODispatcher";

interface IOLineLoggerProps {
	id: number | string;
	color: "blue" | "red" | "orange" | "purple" | "green";
	topIn?: boolean;
	topOut?: boolean;
	bottomIn?: boolean;
	bottomOut?: boolean;
	retry?: number;
};

const colorMap = {
	blue: "bg-blue-500",
	red: "bg-red-500",
	orange: "bg-orange-500",
	purple: "bg-purple-500",
	green: "bg-green-500",
};

export function IOLineLogger({ id, color, topIn, topOut, bottomIn, bottomOut, retry }: IOLineLoggerProps)
{
	return (
		<div className="flex flex-col">
			<p className="text-center">{ id }:{ color } - <strong>Logger</strong></p>
			<IODispatcher 
				className={ `block min-h-[3px] w-full ${ colorMap[ color ] } my-3` }
				dispatch={{
					"top-in": topIn ? () => console.log( `${ color }: top-in` ) : undefined,
					"top-out": topOut ? () => console.log( `${ color }: top-out` ) : undefined,
					"bottom-in": bottomIn ? () => console.log( `${ color }: bottom-in` ) : undefined,
					"bottom-out": bottomOut ? () => console.log( `${ color }: bottom-out` ) : undefined,
					//@ts-expect-error - Requires at least 1
					retry: retry ?? undefined
				}}
			/>
			<p className="text-center">{ id }:{ color } - <strong>Logger</strong></p>
		</div>
	)
}