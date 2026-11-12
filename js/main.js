const DATA_FILE = 'data/outcomes_by_category.csv';
const CATEGORY_ORDER = ['Abuse of Authority', 'Force', 'Discourtesy', 'Offensive Language'];
const OUTCOME_GROUPS = ['Substantiated', 'Unsubstantiated', 'Exonerated'];
const OUTCOME_COLORS = {
  Substantiated: '#257a67',
  Unsubstantiated: '#e3a54b',
  Exonerated: '#6b86b6',
};

const tooltip = d3.select('#tooltip');
const formatNumber = d3.format(',');
const formatPercent = d3.format('.1%');

function showTip(event, html) {
  tooltip.html(html).attr('hidden', null);
  moveTip(event);
}

function moveTip(event) {
  const node = tooltip.node();
  const left = Math.min(event.clientX + 15, window.innerWidth - node.offsetWidth - 12);
  const top = Math.min(event.clientY + 15, window.innerHeight - node.offsetHeight - 12);

  tooltip
    .style('left', `${Math.max(8, left)}px`)
    .style('top', `${Math.max(8, top)}px`);
}

function hideTip() {
  tooltip.attr('hidden', true);
}

function makeSvg(selector, height = 370) {
  const width = 920;
  const margin = { top: 35, right: 25, bottom: 75, left: 170 };

  const svg = d3
    .select(selector)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('role', 'img');

  return {
    svg,
    width,
    height,
    margin,
    innerWidth: width - margin.left - margin.right,
    innerHeight: height - margin.top - margin.bottom,
  };
}

function makeLegend(svg, items, x, y) {
  let currentX = x;

  items.forEach(([label, color]) => {
    svg
      .append('rect')
      .attr('x', currentX)
      .attr('y', y - 11)
      .attr('width', 12)
      .attr('height', 12)
      .attr('fill', color);

    svg
      .append('text')
      .attr('x', currentX + 18)
      .attr('y', y)
      .attr('font-size', 12)
      .attr('fill', '#455468')
      .text(label);

    currentX += label.length * 7 + 43;
  });
}

function initializeCharts() {
  d3.csv(DATA_FILE, (row) => ({
    ...row,
    count: +row.count,
  }))
    .then((rows) => {
      renderWhiteHat(rows);
      renderBlackHat(rows);

      let revealed = false;

      d3.select('#reveal-button').on('click', () => {
        revealed = !revealed;
        hideTip();
        renderBlackHat(rows, revealed);
      });

      d3.select('#category-filter').on('change', function () {
        hideTip();
        renderWhiteHat(rows, this.value);
      });
    })
    .catch((error) => {
      console.error(error);
      d3.selectAll('.chart').text('Unable to load chart data. Run a local HTTP server (see README).');
    });
}

document.addEventListener('DOMContentLoaded', initializeCharts);