interface PackageBadgesProps {
	packageName: string;
	codecovFlag: string;
};

export function PackageBadges({ packageName, codecovFlag }: PackageBadgesProps)
{
	return (
		<div className="flex gap-spacing-xs">
			<a href={ `https://www.npmjs.com/package/${ packageName }` } target="_blank" className="flex">
				<img src={ `https://img.shields.io/npm/v/${ packageName }` } />
			</a>
			<a href={ `https://bundlephobia.com/result?p=${ packageName }` } target="_blank" className="flex">
				<img src={ `https://img.shields.io/bundlephobia/minzip/${ packageName }` } />
			</a>
			<a href={ `https://app.codecov.io/gh/yunusbayraktaroglu/pronotron-tech-art-suite?flags%5B0%5D=${ codecovFlag }` } target="_blank" className="flex">
				<img src={ `https://codecov.io/gh/yunusbayraktaroglu/pronotron-tech-art-suite/branch/main/graph/badge.svg?flag=${ codecovFlag }&precision=1` } />
			</a>
		</div>
	)
}