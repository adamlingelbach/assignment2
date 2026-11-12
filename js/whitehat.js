function renderWhiteHat(rows, selected = 'All') {
    const categories = selected === 'All' ? CATEGORY_ORDER : [selected];

    d3.select('#white-chart').selectAll('*').remove();

    const { svg, height, margin, innerWidth, innerHeight } = makeSvg(
        '#white-chart',
        Math.max(230, 145 + categories.length * 62)
    );

    svg.attr(
        'aria-label',
        `100 percent stacked bars for ${selected === 'All' ? 'all four misconduct categories' : selected}, comparing substantiated, unsubstantiated, and exonerated allegations`
    );

    const x = d3.scaleLinear().domain([0, 1]).range([0, innerWidth]);
    const y = d3.scaleBand().domain(categories).range([0, innerHeight]).padding(0.3);
    const group = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    group
        .append('g')
        .attr('class', 'gridline')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x).tickValues([0, 0.25, 0.5, 0.75, 1]).tickSize(-innerHeight).tickFormat(''));

    group
        .append('g')
        .attr('class', 'axis')
        .call(d3.axisLeft(y).tickSize(0))
        .select('.domain')
        .remove();

    group
        .append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x).tickValues([0, 0.25, 0.5, 0.75, 1]).tickFormat(d3.format('.0%')));

    let visibleTotal = 0;

    categories.forEach((category) => {
        const categoryRows = rows.filter((row) => row.fado_type === category);
        const total = d3.sum(categoryRows, (row) => row.count);
        visibleTotal += total;

        let runningTotal = 0;

        OUTCOME_GROUPS.forEach((groupName) => {
            const count = categoryRows.find((row) => row.outcome_group === groupName)?.count || 0;
            const portion = total > 0 ? count / total : 0;
            const label = `${category}: ${groupName}, ${formatNumber(count)} allegations, ${formatPercent(portion)} of ${formatNumber(total)} allegations`;

            const rect = group
                .append('rect')
                .attr('x', x(runningTotal))
                .attr('y', y(category))
                .attr('width', x(portion))
                .attr('height', y.bandwidth())
                .attr('fill', OUTCOME_COLORS[groupName])
                .attr('tabindex', 0)
                .attr('role', 'img')
                .attr('aria-label', label);

            rect
                .on('mousemove', (event) => {
                    showTip(
                        event,
                        `<strong>${category}</strong><br>${groupName}: ${formatNumber(count)} (${formatPercent(portion)})<br>Category total: ${formatNumber(total)}`
                    );
                })
                .on('mouseleave', hideTip);

            rect.append('title').text(label);

            runningTotal += portion;
        });
    });

    makeLegend(
        svg,
        OUTCOME_GROUPS.map((key) => [key, OUTCOME_COLORS[key]]),
        margin.left,
        height - 20
    );

    d3.select('#white-summary').text(
        `${formatNumber(visibleTotal)} allegation records shown across ${categories.length} misconduct ${categories.length === 1 ? 'category' : 'categories'}. Each bar totals 100%.`
    );
}