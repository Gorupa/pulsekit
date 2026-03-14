# pulsekit.js

[![Live Demo](https://img.shields.io/badge/Live%20Demo-pulsekit.js-5f259f?style=for-the-badge)](https://gorupa.github.io/pulsekit.js)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)
[![Open Source](https://img.shields.io/badge/Open%20Source-Yes-6d28d9?style=for-the-badge&logo=github)](https://github.com/gorupa/pulsekit.js)
[![Data License](https://img.shields.io/badge/Data-CDLA--Permissive--2.0-blue?style=for-the-badge)](https://github.com/PhonePe/pulse)

> A JavaScript library for visualising PhonePe Pulse India payments data — beautifully, with zero setup.

Drop one `<script>` tag into any project and get real transaction charts, growth trends and state rankings powered by the official [PhonePe Pulse](https://github.com/PhonePe/pulse) public dataset.

---

## Features

- **Zero dependencies** — pure vanilla JS, no npm, no build step
- **3 ready-to-use components** — CategoryChart, GrowthChart, StateRanking
- **Live data** — fetches directly from the PhonePe Pulse GitHub repo
- **All 36 states** — complete India coverage, 2018 to 2023
- **Animated** — smooth bar and line chart transitions
- **Accessible** — hover tooltips, readable labels, semantic HTML

---

## Quick Start

```html
<!-- 1. Include the library -->
<script src="https://cdn.jsdelivr.net/gh/gorupa/pulsekit/src/pulsekit.js"></script>

<!-- 2. Add a container -->
<div id="chart"></div>

<!-- 3. Render a chart -->
<script>
  PulseKit.CategoryChart('#chart', {
    state:   'delhi',
    year:    2023,
    quarter: 1
  });
</script>
```

That's it. No API keys. No backend.

---

## Components

### 📊 CategoryChart

Horizontal bar chart showing transaction categories (P2P, P2M, Recharge, etc.) for a state and quarter.

```js
PulseKit.CategoryChart('#el', {
  state:   'maharashtra', // state slug
  year:    2022,          // 2018–2023
  quarter: 2,             // 1, 2, 3 or 4
  metric:  'count'        // 'count' or 'amount'
});
```

### 📈 GrowthChart

Line chart showing UPI transaction growth across all available quarters for a state.

```js
PulseKit.GrowthChart('#el', {
  state:  'karnataka',
  metric: 'amount'
});
```

### 🏆 StateRanking

Ranked bar chart comparing all Indian states for a given period.

```js
PulseKit.StateRanking('#el', {
  year:    2023,
  quarter: 1,
  metric:  'count',
  top:     10      // how many states to show
});
```

---

## State Slugs

Use lowercase hyphenated state names as they appear in the PhonePe Pulse repo:

| State | Slug |
|---|---|
| Andhra Pradesh | `andhra-pradesh` |
| Delhi | `delhi` |
| Gujarat | `gujarat` |
| Karnataka | `karnataka` |
| Maharashtra | `maharashtra` |
| Rajasthan | `rajasthan` |
| Tamil Nadu | `tamil-nadu` |
| Uttar Pradesh | `uttar-pradesh` |
| West Bengal | `west-bengal` |

All 36 states are available. Full list in `PulseKit.utils.ALL_STATES`.

---

## Advanced Usage

Access raw data fetching utilities for custom visualisations:

```js
// Fetch one quarter
const data = await PulseKit.utils.fetchStateQuarter('delhi', 2023, 1);

// Fetch all quarters for a state
const history = await PulseKit.utils.fetchAllQuarters('maharashtra');

// Fetch all states for a period
const states = await PulseKit.utils.fetchAllStates(2022, 4);

// Format helpers
PulseKit.utils.formatCrore(1234567890); // → "123.46 Cr"
PulseKit.utils.formatCount(5600000);    // → "560.0L"
PulseKit.utils.toDisplayName('tamil-nadu'); // → "Tamil Nadu"
```

---

## File Structure

```
pulsekit/
├── src/
│   └── pulsekit.js        ← source library
├── dist/
│   └── pulsekit.min.js    ← minified build (v0.2)
├── demo/
│   └── index.html         ← live demo + docs page
├── README.md
└── LICENSE
```

---

## Data Source

All data is sourced from the official [PhonePe Pulse](https://github.com/PhonePe/pulse) repository, licensed under [CDLA-Permissive-2.0](https://cdla.dev/permissive-2-0/).

pulsekit.js fetches data directly from `raw.githubusercontent.com` — no proxy, no backend, no data storage.

---

## Contributing

Pull requests are welcome! Ideas for v0.2:

- [ ] India SVG choropleth map component
- [ ] District-level data support
- [ ] User registration data charts
- [ ] Dark mode option
- [ ] React wrapper package

---

## License

[MIT](LICENSE) © 2026 [gorupa](https://github.com/gorupa)

Data © PhonePe · [CDLA-Permissive-2.0](https://github.com/PhonePe/pulse/blob/master/LICENSE)
