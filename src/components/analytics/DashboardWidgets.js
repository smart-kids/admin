import React from 'react';

/**
 * Premium Stat Card with icon and badge
 */
export const StatCard = ({ title, value, subtext, icon, color = '#3699ff', trend }) => (
    <div className="card card-custom gutter-b shadow-hover" style={{ height: '140px', borderRadius: '15px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', transition: 'transform 0.2s' }}>
        <div className="card-body d-flex flex-column p-8">
            <div className="d-flex align-items-center justify-content-between mb-2">
                <span className={`symbol symbol-45 symbol-light-${color === '#3699ff' ? 'primary' : 'success'}`}>
                    <span className="symbol-label">
                        <i className={`text-${color === '#3699ff' ? 'primary' : 'success'} ${icon}`} style={{ fontSize: '3.2rem', margin: '1rem' }}></i>
                    </span>
                </span>
                {trend && (
                    <span className={`label label-light-${trend > 0 ? 'success' : 'danger'} label-inline font-weight-bold`}>
                        {trend > 0 ? '+' : ''}{trend}%
                    </span>
                )}
            </div>
            <div className="d-flex flex-column">
                <span className="text-dark-75 font-weight-bolder font-size-h3">{value}</span>
                <span className="text-muted font-weight-bold font-size-sm">{title}</span>
                {subtext && <span className="text-muted font-size-xs mt-1">{subtext}</span>}
            </div>
        </div>
    </div>
);

/**
 * SVG Donut Distribution Chart
 */
export const DistributionChart = ({ data, title, height = 200 }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let cumulativePercent = 0;

    const getCoordinatesForPercent = (percent) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    return (
        <div className="card card-custom gutter-b" style={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
            <div className="card-header border-0 pt-5">
                <h3 className="card-title align-items-start flex-column">
                    <span className="card-label font-weight-bolder text-dark">{title}</span>
                </h3>
            </div>
            <div className="card-body pt-2 d-flex align-items-center flex-wrap">
                <div style={{ position: 'relative', width: '150px', height: '150px', marginRight: '30px' }}>
                    <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                        {data.map((item, i) => {
                            const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
                            cumulativePercent += item.value / (total || 1);
                            const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
                            const largeArcFlag = item.value / (total || 1) > 0.5 ? 1 : 0;
                            const pathData = `M ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} L 0 0`;
                            return <path key={i} d={pathData} fill={item.color} style={{ transition: 'all 0.3s' }} />;
                        })}
                        <circle cx="0" cy="0" r="0.72" fill="#fff" />
                    </svg>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#3f4254', lineHeight: 1 }}>{total}</div>
                        <div style={{ fontSize: '0.65rem', color: '#b5b5c3', textTransform: 'uppercase', fontWeight: 700, marginTop: '2px' }}>Total</div>
                    </div>
                </div>
                <div className="d-flex flex-column justify-content-center" style={{ flex: 1, minWidth: '140px' }}>
                    {data.map((item, i) => (
                        <div key={i} className="d-flex align-items-center mb-3">
                            <span className="bullet bullet-sm mr-3" style={{ backgroundColor: item.color, width: '8px', height: '8px' }}></span>
                            <span className="text-muted font-weight-bold font-size-sm flex-grow-1" style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
                            <span className="text-dark-75 font-weight-bolder font-size-sm ml-4">{Math.round((item.value / (total || 1)) * 100)}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

/**
 * SVG Performance Trend Bar Chart
 */
export const TrendBarChart = ({ data, title, height = 250 }) => {
    const maxVal = Math.max(...data.map(d => d.value), 10);
    const chartHeight = height - 100;
    const padding = 20;

    return (
        <div className="card card-custom gutter-b" style={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
            <div className="card-header border-0 pt-5">
                <h3 className="card-title align-items-start flex-column">
                    <span className="card-label font-weight-bolder text-dark">{title}</span>
                </h3>
            </div>
            <div className="card-body pt-0" style={{ height: `${height}px` }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', height: `${chartHeight}px`, gap: '15px', padding: `0 ${padding}px` }}>
                    {data.map((d, i) => {
                        const barHeight = (d.value / maxVal) * chartHeight;
                        return (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ 
                                    width: '100%', 
                                    height: `${barHeight}px`, 
                                    background: d.color || '#3699ff', 
                                    borderRadius: '6px 6px 0 0',
                                    position: 'relative',
                                    transition: 'height 0.4s ease',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                }}>
                                    <div style={{ position: 'absolute', top: '-25px', width: '100%', textAlign: 'center', fontSize: '10px', fontWeight: 800, color: '#3f4254' }}>
                                        {Math.round(d.value)}
                                    </div>
                                </div>
                                <div style={{ marginTop: '10px', fontSize: '10px', fontWeight: 700, color: '#b5b5c3', textTransform: 'uppercase', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                                    {d.label}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

/**
 * SVG Area Trend Chart (Line with Gradient)
 */
export const AreaChart = ({ data, title, height = 250, color = '#3699ff' }) => {
    if (!data || data.length === 0) return null;
    const maxVal = Math.max(...data.map(d => d.value), 10) * 1.1;
    const chartHeight = height - 100;
    const chartWidth = 400;
    const padding = 20;

    const points = data.map((d, i) => {
        const x = padding + (i * ((chartWidth - 2 * padding) / (data.length - 1 || 1)));
        const y = chartHeight - ((d.value / maxVal) * (chartHeight - padding));
        return { x, y };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

    return (
        <div className="card card-custom gutter-b" style={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
            <div className="card-header border-0 pt-5">
                <h3 className="card-title align-items-start flex-column">
                    <span className="card-label font-weight-bolder text-dark">{title}</span>
                </h3>
            </div>
            <div className="card-body pt-0" style={{ height: `${height}px` }}>
                <div style={{ height: `${chartHeight}px`, width: '100%', position: 'relative' }}>
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
                        <defs>
                            <linearGradient id={`grad-${title.replace(/\s+/g, '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.3 }} />
                                <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
                            </linearGradient>
                        </defs>
                        <path d={areaPath} fill={`url(#grad-${title.replace(/\s+/g, '')})`} />
                        <path d={linePath} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        {points.map((p, i) => (
                            <circle key={i} cx={p.x} cy={p.y} r="4" fill="white" stroke={color} strokeWidth="2" />
                        ))}
                    </svg>
                </div>
                <div className="d-flex justify-content-between mt-4 px-2">
                    {data.map((d, i) => (
                        <div key={i} style={{ fontSize: '9px', fontWeight: 700, color: '#b5b5c3', textTransform: 'uppercase', textAlign: 'center' }}>
                            {d.label}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

/**
 * Ranking List Component (Top Performers / Debtors)
 */
export const RankingList = ({ data, title, height = 300, valuePrefix = '', valueSuffix = '' }) => (
    <div className="card card-custom gutter-b" style={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', minHeight: `${height}px` }}>
        <div className="card-header border-0 pt-5">
            <h3 className="card-title align-items-start flex-column">
                <span className="card-label font-weight-bolder text-dark">{title}</span>
            </h3>
        </div>
        <div className="card-body pt-2">
            {data.map((item, i) => (
                <div key={i} className="d-flex align-items-center mb-6 grow-on-hover" style={{ transition: 'transform 0.2s' }}>
                    <div className="symbol symbol-40 symbol-light-primary mr-5">
                        <span className="symbol-label font-weight-bolder font-size-lg" style={{ color: item.color || '#3699ff', backgroundColor: `${item.color || '#3699ff'}15` }}>
                            {i + 1}
                        </span>
                    </div>
                    <div className="d-flex flex-column flex-grow-1">
                        <span className="text-dark-75 font-weight-bolder text-hover-primary font-size-lg mb-1">{item.label}</span>
                        <span className="text-muted font-weight-bold font-size-sm">{item.subtext}</span>
                    </div>
                    <div className="d-flex flex-column text-right">
                        <span className="text-dark-75 font-weight-bolder font-size-lg">{valuePrefix}{item.value.toLocaleString()}{valueSuffix}</span>
                        <div className="progress progress-xs w-100px mt-1" style={{ height: '4px' }}>
                            <div className="progress-bar" role="progressbar" style={{ width: `${Math.min(100, (item.value / (data[0]?.value || 1)) * 100)}%`, backgroundColor: item.color || '#3699ff' }}></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export default { StatCard, DistributionChart, TrendBarChart, AreaChart, RankingList };
