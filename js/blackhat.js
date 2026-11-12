function renderBlackHat(rows, reveal = false) {
  d3.select('#black-chart').selectAll('*').remove();

  const { svg, height, margin, innerWidth, innerHeight } = makeSvg('#black-chart', 390);

  svg.attr(
    'aria-label',
    reveal
      ? 'Three separate outcomes by misconduct category'
      : 'Deliberately grouped allegation outcomes by misconduct category'
  );

  const x = d3.scaleLinear().domain([0, 1]).range([0, innerWidth]);
  const y = d3.scaleBand().domain(CATEGORY_ORDER).range([0, innerHeight]).padding(0.3);
  const group = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

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

  CATEGORY_ORDER.forEach((category) => {
    const categoryRows = rows.filter((row) => row.category === category);
    const total = d3.sum(categoryRows, (row) => row.count);

    const count = (outcomeKey) => categoryRows.find((row) => row.outcome === outcomeKey)?.count || 0;

    const segments = reveal
      ? [
          { name: 'Unsubstantiated', count: count('Unsubstantiated'), color: '#e3a54b' },
          { name: 'Exonerated', count: count('Exonerated'), color: '#6b86b6' },
          { name: 'Substantiated', count: count('Substantiated'), color: '#257a67' },
        ]
      : [
          { name: 'Not substantiated', count: count('Unsubstantiated') + count('Exonerated'), color: '#437a91' },
          { name: 'Substantiated', count: count('Substantiated'), color: '#c9d3de' },
        ];

    let runningTotal = 0;

    segments.forEach((segment) => {
      const share = total > 0 ? segment.count / total : 0;
      const label = `${category}: ${segment.name}, ${formatNumber(segment.count)} of ${formatNumber(total)} allegations (${formatPercent(share)})`;

      const rect = group
        .append('rect')
        .attr('x', x(runningTotal))
        .attr('y', y(category))
        .attr('width', x(share))
        .attr('height', y.bandwidth())
        .attr('fill', segment.color)
        .attr('tabindex', 0)
        .attr('role', 'img')
        .attr('aria-label', label);

      rect
        .on('mousemove', (event) => {
          showTip(
            event,
            `<strong>${category}</strong><br>${segment.name}: ${formatNumber(segment.count)} (${formatPercent(share)})<br>Category total: ${formatNumber(total)}`
          );
        })
        .on('mouseleave', hideTip);

      rect.append('title').text(label);

      if (!reveal && segment.name === 'Not substantiated') {
        group
          .append('text')
          .attr('x', x(runningTotal + share / 2))
          .attr('y', y(category) + y.bandwidth() / 2 + 5)
          .attr('text-anchor', 'middle')
          .attr('font-size', 15)
          .attr('font-weight', 700)
          .attr('fill', 'white')
          .text(d3.format('.0%')(share));
      }

      runningTotal += share;
    });
  });

  makeLegend(
    svg,
    reveal
      ? [
          ['Unsubstantiated', '#e3a54b'],
          ['Exonerated', '#6b86b6'],
          ['Substantiated', '#257a67'],
        ]
      : [
          ['Not substantiated', '#437a91'],
          ['Substantiated', '#c9d3de'],
        ],
    margin.left,
    height - 20
  );

  d3.select('#black-title').text(
    reveal ? 'What do the three distinct outcomes actually show?' : 'Most reviewed allegations did not result in substantiation'
  );

  d3.select('#black-description').text(
    reveal
      ? 'The original outcome distinctions are restored; compare this with the persuasive grouping.'
      : 'A single large segment makes the share of allegations without substantiation appear decisive.'
  );

  d3.select('#reveal-button')
    .text(reveal ? 'Return to persuasive view' : 'Reveal the manipulation')
    .attr('aria-pressed', reveal);

  d3.select('#reveal-explanation').property('hidden', !reveal);
}
