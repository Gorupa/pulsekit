/*!
 * pulsekit.js v0.1.0
 * A JavaScript library for visualising PhonePe Pulse
 * India payments data — beautifully, with zero setup.
 *
 * Author : gorupa (https://github.com/gorupa)
 * License: MIT
 * Data   : PhonePe Pulse (CDLA-Permissive-2.0)
 *          https://github.com/PhonePe/pulse
 *
 * Usage:
 *   PulseKit.CategoryChart('#el', { state, year, quarter })
 *   PulseKit.GrowthChart('#el', { state, metric })
 *   PulseKit.StateRanking('#el', { year, quarter, metric })
 */

(function (global) {
  'use strict';

  /* ─────────────────────────────────────────────
     CONSTANTS
  ───────────────────────────────────────────── */

  const BASE_URL =
    'https://raw.githubusercontent.com/PhonePe/pulse/master/data/aggregated/transaction/country/india';

  /** All states exactly as PhonePe names their folders */
  const ALL_STATES = [
    'andaman-&-nicobar-islands', 'andhra-pradesh', 'arunachal-pradesh',
    'assam', 'bihar', 'chandigarh', 'chhattisgarh',
    'dadra-&-nagar-haveli-&-daman-&-diu', 'delhi', 'goa', 'gujarat',
    'haryana', 'himachal-pradesh', 'jammu-&-kashmir', 'jharkhand',
    'karnataka', 'kerala', 'ladakh', 'lakshadweep', 'madhya-pradesh',
    'maharashtra', 'manipur', 'meghalaya', 'mizoram', 'nagaland',
    'odisha', 'puducherry', 'punjab', 'rajasthan', 'sikkim',
    'tamil-nadu', 'telangana', 'tripura', 'uttar-pradesh',
    'uttarakhand', 'west-bengal',
  ];

  const YEARS     = [2018, 2019, 2020, 2021, 2022, 2023];
  const QUARTERS  = [1, 2, 3, 4];
  const Q_LABELS  = { 1: 'Q1 (Jan–Mar)', 2: 'Q2 (Apr–Jun)', 3: 'Q3 (Jul–Sep)', 4: 'Q4 (Oct–Dec)' };

  /** PhonePe brand purple + accent palette */
  const COLORS = {
    primary:  '#5f259f',
    accent:   '#e63329',
    purple:   ['#5f259f', '#7b2fbe', '#9b59d0', '#b07fdc', '#c9aae8', '#e4d5f5'],
    category: ['#5f259f', '#e63329', '#f5a623', '#1e8e3e', '#1a73e8', '#00b0ff'],
  };

  /* ─────────────────────────────────────────────
     DATA FETCHING
  ───────────────────────────────────────────── */

  /**
   * Fetch a single quarter JSON for a state
   * @param {string} state - e.g. 'delhi'
   * @param {number} year
   * @param {number} quarter - 1–4
   */
  async function fetchStateQuarter(state, year, quarter) {
    const url = `${BASE_URL}/state/${state}/${year}/${quarter}.json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`No data: ${state} ${year} Q${quarter}`);
    return res.json();
  }

  /**
   * Fetch all available quarters for a state across all years
   * Returns array of { year, quarter, data }
   */
  async function fetchAllQuarters(state) {
    const results = [];
    const promises = [];
    for (const year of YEARS) {
      for (const q of QUARTERS) {
        promises.push(
          fetchStateQuarter(state, year, q)
            .then(data => results.push({ year, quarter: q, data }))
            .catch(() => { /* quarter not yet published — skip */ })
        );
      }
    }
    await Promise.all(promises);
    results.sort((a, b) => a.year !== b.year ? a.year - b.year : a.quarter - b.quarter);
    return results;
  }

  /**
   * Fetch one quarter for all states (for ranking)
   */
  async function fetchAllStates(year, quarter) {
    const results = [];
    await Promise.all(
      ALL_STATES.map(state =>
        fetchStateQuarter(state, year, quarter)
          .then(data => results.push({ state, data }))
          .catch(() => {})
      )
    );
    return results;
  }

  /* ─────────────────────────────────────────────
     HELPERS
  ───────────────────────────────────────────── */

  function formatCrore(n) {
    if (n >= 1e7) return (n / 1e7).toFixed(2) + ' Cr';
    if (n >= 1e5) return (n / 1e5).toFixed(2) + ' L';
    return n.toLocaleString('en-IN');
  }

  function formatCount(n) {
    if (n >= 1e7) return (n / 1e7).toFixed(1) + 'Cr';
    if (n >= 1e5) return (n / 1e5).toFixed(1) + 'L';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n.toString();
  }

  function toDisplayName(slug) {
    return slug
      .replace(/-&-/g, ' & ')
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  function resolve(selector) {
    const el = typeof selector === 'string'
      ? document.querySelector(selector)
      : selector;
    if (!el) throw new Error(`PulseKit: element not found — "${selector}"`);
    return el;
  }

  function loading(el, msg = 'Loading PhonePe Pulse data…') {
    el.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;
                  justify-content:center;gap:12px;padding:40px;
                  font-family:sans-serif;color:#5f6368;">
        <div style="width:36px;height:36px;border:3px solid #e0d5f5;
                    border-top-color:#5f259f;border-radius:50%;
                    animation:pkSpin 0.8s linear infinite;"></div>
        <div style="font-size:0.85rem;">${msg}</div>
        <style>@keyframes pkSpin{to{transform:rotate(360deg)}}</style>
      </div>`;
  }

  function error(el, msg) {
    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;padding:20px;
                  background:#fce8e6;border-radius:10px;
                  font-family:sans-serif;color:#c5221f;font-size:0.85rem;">
        <span>⚠️</span><span>${msg}</span>
      </div>`;
  }

  /** Inject base card styles once */
  function injectBaseStyles() {
    if (document.getElementById('pulsekit-styles')) return;
    const s = document.createElement('style');
    s.id = 'pulsekit-styles';
    s.textContent = `
      .pk-card {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 2px 12px rgba(95,37,159,0.1), 0 1px 3px rgba(0,0,0,0.06);
        overflow: hidden;
      }
      .pk-header {
        padding: 18px 20px 14px;
        border-bottom: 1px solid #f3eefa;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }
      .pk-title {
        font-size: 0.95rem;
        font-weight: 600;
        color: #202124;
        margin-bottom: 2px;
      }
      .pk-subtitle {
        font-size: 0.75rem;
        color: #5f6368;
      }
      .pk-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 0.68rem;
        font-weight: 600;
        color: #5f259f;
        background: #f3eefa;
        border: 1px solid #d9b8f5;
        border-radius: 100px;
        padding: 3px 10px;
        white-space: nowrap;
        flex-shrink: 0;
      }
      .pk-body { padding: 16px 20px 20px; }
      .pk-bar-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
      }
      .pk-bar-label {
        font-size: 0.78rem;
        color: #3c4043;
        width: 160px;
        flex-shrink: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .pk-bar-track {
        flex: 1;
        height: 10px;
        background: #f1f3f4;
        border-radius: 100px;
        overflow: hidden;
      }
      .pk-bar-fill {
        height: 100%;
        border-radius: 100px;
        transition: width 0.6s cubic-bezier(0.4,0,0.2,1);
      }
      .pk-bar-value {
        font-size: 0.75rem;
        color: #5f6368;
        width: 80px;
        text-align: right;
        flex-shrink: 0;
        font-variant-numeric: tabular-nums;
      }
      .pk-line-svg { width: 100%; overflow: visible; }
      .pk-line-svg .pk-dot:hover { r: 5; }
      .pk-tooltip {
        position: absolute;
        background: #1c1c1e;
        color: #fff;
        font-size: 0.75rem;
        padding: 6px 10px;
        border-radius: 8px;
        pointer-events: none;
        white-space: nowrap;
        opacity: 0;
        transition: opacity 0.15s;
        z-index: 9999;
      }
      .pk-footer {
        padding: 10px 20px;
        border-top: 1px solid #f3eefa;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 0.68rem;
        color: #9aa0a6;
      }
      .pk-footer a { color: #5f259f; text-decoration: none; font-weight: 500; }
      .pk-footer a:hover { text-decoration: underline; }
    `;
    document.head.appendChild(s);
  }

  /* ─────────────────────────────────────────────
     COMPONENT 1 — CategoryChart
     Shows transaction categories for a given
     state / year / quarter as horizontal bars.
  ───────────────────────────────────────────── */

  /**
   * Render a horizontal bar chart of transaction categories.
   *
   * @param {string|Element} selector
   * @param {object} opts
   * @param {string} opts.state    - e.g. 'delhi'
   * @param {number} opts.year     - e.g. 2023
   * @param {number} opts.quarter  - 1–4
   * @param {'count'|'amount'} [opts.metric='count']
   */
  async function CategoryChart(selector, opts = {}) {
    injectBaseStyles();
    const el = resolve(selector);
    const {
      state   = 'delhi',
      year    = 2023,
      quarter = 1,
      metric  = 'count',
    } = opts;

    loading(el, `Loading ${toDisplayName(state)} Q${quarter} ${year}…`);

    let json;
    try {
      json = await fetchStateQuarter(state, year, quarter);
    } catch (e) {
      error(el, `Could not load data for ${toDisplayName(state)} ${year} Q${quarter}. Try a different period.`);
      return;
    }

    const rows = json.data.transactionData.map(item => ({
      name:   item.name,
      count:  item.paymentInstruments[0].count,
      amount: item.paymentInstruments[0].amount,
    }));

    const key    = metric === 'amount' ? 'amount' : 'count';
    const max    = Math.max(...rows.map(r => r[key]));
    const label  = metric === 'amount' ? 'Amount (₹)' : 'Transactions';
    const fmt    = metric === 'amount' ? formatCrore : formatCount;
    const total  = rows.reduce((s, r) => s + r[key], 0);

    el.innerHTML = `
      <div class="pk-card">
        <div class="pk-header">
          <div>
            <div class="pk-title">${toDisplayName(state)} — Transaction Categories</div>
            <div class="pk-subtitle">${Q_LABELS[quarter]}, ${year} · ${label}</div>
          </div>
          <div class="pk-badge">📊 PhonePe Pulse</div>
        </div>
        <div class="pk-body" id="pk-cat-body"></div>
        <div class="pk-footer">
          <span>Total: <strong>${fmt(total)}</strong></span>
          <a href="https://github.com/PhonePe/pulse" target="_blank" rel="noopener">Data: PhonePe Pulse ↗</a>
        </div>
      </div>`;

    const body = el.querySelector('#pk-cat-body');
    rows.forEach((row, i) => {
      const pct = max > 0 ? (row[key] / max * 100) : 0;
      const div = document.createElement('div');
      div.className = 'pk-bar-row';
      div.innerHTML = `
        <div class="pk-bar-label" title="${row.name}">${row.name}</div>
        <div class="pk-bar-track">
          <div class="pk-bar-fill" style="width:0%;background:${COLORS.category[i % COLORS.category.length]};"
               data-width="${pct}"></div>
        </div>
        <div class="pk-bar-value">${fmt(row[key])}</div>`;
      body.appendChild(div);
    });

    // Animate bars after paint
    requestAnimationFrame(() => {
      el.querySelectorAll('.pk-bar-fill').forEach(bar => {
        bar.style.width = bar.dataset.width + '%';
      });
    });
  }

  /* ─────────────────────────────────────────────
     COMPONENT 2 — GrowthChart
     Line chart of transaction count or amount
     across all available quarters for a state.
  ───────────────────────────────────────────── */

  /**
   * Render a line chart showing UPI growth over time for a state.
   *
   * @param {string|Element} selector
   * @param {object} opts
   * @param {string} opts.state
   * @param {'count'|'amount'} [opts.metric='count']
   */
  async function GrowthChart(selector, opts = {}) {
    injectBaseStyles();
    const el = resolve(selector);
    const { state = 'delhi', metric = 'count' } = opts;

    loading(el, `Loading growth data for ${toDisplayName(state)}…`);

    let quarters;
    try {
      quarters = await fetchAllQuarters(state);
    } catch (e) {
      error(el, 'Failed to load growth data.');
      return;
    }

    if (quarters.length === 0) {
      error(el, `No data available for ${toDisplayName(state)}.`);
      return;
    }

    const key   = metric === 'amount' ? 'amount' : 'count';
    const label = metric === 'amount' ? 'Amount (₹)' : 'Transaction Count';
    const fmt   = metric === 'amount' ? formatCrore : formatCount;

    // Sum all categories per quarter
    const points = quarters.map(q => {
      const total = q.data.data.transactionData.reduce(
        (s, item) => s + item.paymentInstruments[0][key], 0
      );
      return { label: `Q${q.quarter} '${String(q.year).slice(2)}`, value: total };
    });

    const W  = 560;
    const H  = 180;
    const PL = 12; // padding left
    const PR = 12;
    const PT = 16;
    const PB = 28;
    const IW = W - PL - PR;
    const IH = H - PT - PB;

    const maxVal = Math.max(...points.map(p => p.value));
    const xStep  = IW / (points.length - 1 || 1);

    const toX = i  => PL + i * xStep;
    const toY = v  => PT + IH - (v / maxVal) * IH;

    const pathD = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(p.value).toFixed(1)}`)
      .join(' ');

    const areaD = pathD
      + ` L ${toX(points.length - 1).toFixed(1)} ${(PT + IH).toFixed(1)}`
      + ` L ${toX(0).toFixed(1)} ${(PT + IH).toFixed(1)} Z`;

    // X axis labels — show every 4th to avoid crowding
    const xLabels = points.map((p, i) => {
      if (points.length > 12 && i % 4 !== 0 && i !== points.length - 1) return '';
      return `<text x="${toX(i).toFixed(1)}" y="${H - 6}"
        text-anchor="middle" font-size="9" fill="#9aa0a6">${p.label}</text>`;
    }).join('');

    const dots = points.map((p, i) => `
      <circle class="pk-dot" cx="${toX(i).toFixed(1)}" cy="${toY(p.value).toFixed(1)}"
        r="3.5" fill="${COLORS.primary}" stroke="#fff" stroke-width="2"
        data-label="${p.label}" data-value="${fmt(p.value)}"
        style="cursor:pointer;transition:r 0.1s"/>
    `).join('');

    el.innerHTML = `
      <div class="pk-card">
        <div class="pk-header">
          <div>
            <div class="pk-title">${toDisplayName(state)} — UPI Growth Over Time</div>
            <div class="pk-subtitle">${label} · All available quarters</div>
          </div>
          <div class="pk-badge">📈 PhonePe Pulse</div>
        </div>
        <div class="pk-body" style="padding-bottom:8px;position:relative;">
          <svg class="pk-line-svg" viewBox="0 0 ${W} ${H}">
            <defs>
              <linearGradient id="pkAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="${COLORS.primary}" stop-opacity="0.18"/>
                <stop offset="100%" stop-color="${COLORS.primary}" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <!-- Area fill -->
            <path d="${areaD}" fill="url(#pkAreaGrad)"/>
            <!-- Line -->
            <path d="${pathD}" fill="none" stroke="${COLORS.primary}"
              stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <!-- X labels -->
            ${xLabels}
            <!-- Dots -->
            ${dots}
          </svg>
          <div class="pk-tooltip" id="pk-tt"></div>
        </div>
        <div class="pk-footer">
          <span>${points.length} quarters of data</span>
          <a href="https://github.com/PhonePe/pulse" target="_blank" rel="noopener">Data: PhonePe Pulse ↗</a>
        </div>
      </div>`;

    // Tooltip
    const tt = el.querySelector('#pk-tt');
    el.querySelectorAll('.pk-dot').forEach(dot => {
      dot.addEventListener('mouseenter', e => {
        tt.textContent = `${dot.dataset.label}: ${dot.dataset.value}`;
        tt.style.opacity = '1';
      });
      dot.addEventListener('mousemove', e => {
        const rect = el.getBoundingClientRect();
        tt.style.left = (e.clientX - rect.left + 12) + 'px';
        tt.style.top  = (e.clientY - rect.top  - 28) + 'px';
      });
      dot.addEventListener('mouseleave', () => { tt.style.opacity = '0'; });
    });
  }

  /* ─────────────────────────────────────────────
     COMPONENT 3 — StateRanking
     Horizontal bar chart ranking all states
     by transaction count or amount for a period.
  ───────────────────────────────────────────── */

  /**
   * Render a ranked bar chart of all Indian states.
   *
   * @param {string|Element} selector
   * @param {object} opts
   * @param {number} opts.year
   * @param {number} opts.quarter
   * @param {'count'|'amount'} [opts.metric='count']
   * @param {number} [opts.top=10] - how many states to show
   */
  async function StateRanking(selector, opts = {}) {
    injectBaseStyles();
    const el = resolve(selector);
    const {
      year    = 2023,
      quarter = 1,
      metric  = 'count',
      top     = 10,
    } = opts;

    loading(el, `Ranking all states for Q${quarter} ${year}…`);

    let stateData;
    try {
      stateData = await fetchAllStates(year, quarter);
    } catch (e) {
      error(el, 'Failed to load state ranking data.');
      return;
    }

    if (stateData.length === 0) {
      error(el, `No state data for ${year} Q${quarter}.`);
      return;
    }

    const key   = metric === 'amount' ? 'amount' : 'count';
    const label = metric === 'amount' ? 'Amount (₹)' : 'Transaction Count';
    const fmt   = metric === 'amount' ? formatCrore : formatCount;

    // Sum categories per state
    const ranked = stateData
      .map(s => ({
        state: s.state,
        value: s.data.data.transactionData.reduce(
          (sum, item) => sum + item.paymentInstruments[0][key], 0
        ),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, top);

    const max = ranked[0].value;

    el.innerHTML = `
      <div class="pk-card">
        <div class="pk-header">
          <div>
            <div class="pk-title">Top ${top} States — ${label}</div>
            <div class="pk-subtitle">${Q_LABELS[quarter]}, ${year}</div>
          </div>
          <div class="pk-badge">🏆 PhonePe Pulse</div>
        </div>
        <div class="pk-body" id="pk-rank-body"></div>
        <div class="pk-footer">
          <span>${stateData.length} states loaded</span>
          <a href="https://github.com/PhonePe/pulse" target="_blank" rel="noopener">Data: PhonePe Pulse ↗</a>
        </div>
      </div>`;

    const body = el.querySelector('#pk-rank-body');
    ranked.forEach((row, i) => {
      const pct   = max > 0 ? (row.value / max * 100) : 0;
      const shade = COLORS.purple[Math.min(i, COLORS.purple.length - 1)];
      const div   = document.createElement('div');
      div.className = 'pk-bar-row';
      div.innerHTML = `
        <div class="pk-bar-label" title="${toDisplayName(row.state)}">
          <span style="color:#9aa0a6;font-size:0.7rem;margin-right:4px;">#${i + 1}</span>
          ${toDisplayName(row.state)}
        </div>
        <div class="pk-bar-track">
          <div class="pk-bar-fill" style="width:0%;background:${shade};"
               data-width="${pct}"></div>
        </div>
        <div class="pk-bar-value">${fmt(row.value)}</div>`;
      body.appendChild(div);
    });

    requestAnimationFrame(() => {
      el.querySelectorAll('.pk-bar-fill').forEach(bar => {
        bar.style.width = bar.dataset.width + '%';
      });
    });
  }

  /* ─────────────────────────────────────────────
     PUBLIC API
  ───────────────────────────────────────────── */

  const PulseKit = {
    version:      '0.1.0',
    CategoryChart,
    GrowthChart,
    StateRanking,
    /** Expose helpers for advanced use */
    utils: {
      fetchStateQuarter,
      fetchAllQuarters,
      fetchAllStates,
      formatCrore,
      formatCount,
      toDisplayName,
      ALL_STATES,
      YEARS,
    },
  };

  // UMD export — works as <script>, CommonJS, or ESM
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PulseKit;
  } else if (typeof define === 'function' && define.amd) {
    define([], () => PulseKit);
  } else {
    global.PulseKit = PulseKit;
  }

}(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this));
