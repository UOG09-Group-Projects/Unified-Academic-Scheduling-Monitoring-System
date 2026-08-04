// Named single-series bar/donut colors, matching tailwind.config.js's
// palette exactly (ocean-600/700, success, warning, danger, accent-600,
// violet-600) so a dashboard's chart color always traces back to a real
// design token instead of a magic hex string copy-pasted into each page.
//
// Split into light/dark because they aren't just a straight color-scheme
// flip: each variant was run through dataviz/scripts/validate_palette.js
// against this app's actual chart surface (light #FFFFFF, dark #161B29 —
// see CHART_COLORS below) and only kept if it passed. `ocean` in particular
// fails the dark-mode OKLCH lightness band at its light-mode value
// (#00A0F5, L 0.68 — above the 0.48–0.67 dark band) and needed ocean-700
// instead; `neutral` similarly needed a darker slate step, and — being a
// deliberately desaturated "not a category" marker rather than a hue — is
// exempt from the chroma-floor check that applies to the hued colors.
// Components read the right variant via useSeriesColor() (useTheme()-backed).
export const SERIES_COLOR = {
  light: {
    ocean:   '#00A0F5',
    success: '#1F9D6C',
    warning: '#D97706',
    danger:  '#DC2626',
    accent:  '#D25E2A',
    violet:  '#7C3AED',
    neutral: '#CBD5E1',
  },
  dark: {
    ocean:   '#1E6EF5', // ocean-700 — ocean-600 is too light (fails dark lightness band)
    success: '#1F9D6C',
    warning: '#D97706',
    danger:  '#DC2626',
    accent:  '#D25E2A',
    violet:  '#7C3AED',
    neutral: '#64748B', // slate-500 — slate-300 is too light for the dark surface
  },
};

// Fixed-order categorical theme for charts with 3+ unbounded categories
// (e.g. one slice per batch). Validated as a SET (not just individually) in
// both modes — light: worst adjacent CVD ΔE 8.5 (deutan), normal-vision
// 20.5; dark: worst adjacent CVD ΔE 8.5 (deutan), normal-vision 24.9 — both
// clear of the 8.0/15.0 targets. Danger/warning were deliberately left out:
// both sit too close to accent (and to each other) to pass adjacency at any
// ordering. Never cycle past 4 slots or reorder; a 5th+ category folds into
// a single "Other" slice using SERIES_COLOR[theme].neutral instead.
export const CATEGORICAL_THEME = {
  light: [
    SERIES_COLOR.light.ocean,
    SERIES_COLOR.light.success,
    SERIES_COLOR.light.accent,
    SERIES_COLOR.light.violet,
  ],
  dark: [
    SERIES_COLOR.dark.ocean,
    SERIES_COLOR.dark.success,
    SERIES_COLOR.dark.accent,
    SERIES_COLOR.dark.violet,
  ],
};

// Recharts needs literal color values (SVG attributes / inline styles), so
// these can't be Tailwind dark: classes — components read the right set via
// useTheme().
export const CHART_COLORS = {
  light: {
    tick:     '#6B7080',
    grid:     'rgba(18,20,28,0.06)',
    axisLine: 'rgba(18,20,28,0.08)',
    cursor:   'rgba(0,160,245,0.06)',
    // Matches --color-surface (light) — used as the stacked-bar segment gap.
    surface:  '#FFFFFF',
  },
  dark: {
    tick:     '#8B93A7',
    grid:     'rgba(255,255,255,0.08)',
    axisLine: 'rgba(255,255,255,0.12)',
    cursor:   'rgba(0,160,245,0.14)',
    // Matches --color-surface (dark) — used as the stacked-bar segment gap.
    surface:  '#161B29',
  },
};
