interface PackageBadgesProps {
	packageName: string;
};

export function PackageBadges({ packageName }: PackageBadgesProps)
{
	return (
		<div className="flex gap-spacing-xs">
			<a href={ `https://www.npmjs.com/package/${ packageName }` } target="_blank" className="flex">
				<img src={ `https://img.shields.io/npm/v/${ packageName }` } />
			</a>
			<a href={ `https://bundlephobia.com/result?p=${ packageName }` } target="_blank" className="flex">
				<img src={ `https://badgen.net/bundlephobia/minzip/${ packageName }` } />
			</a>
		</div>
	)
}