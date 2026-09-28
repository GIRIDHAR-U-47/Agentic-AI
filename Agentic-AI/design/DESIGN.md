---
name: REC Scholar (R-Lens)
colors:
  surface: '#fff7ff'
  surface-dim: '#dfd8e0'
  surface-bright: '#fff7ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f9f1fa'
  surface-container: '#f3ebf4'
  surface-container-high: '#ede6ef'
  surface-container-highest: '#e8e0e9'
  on-surface: '#1d1a20'
  on-surface-variant: '#4d4450'
  inverse-surface: '#332f36'
  inverse-on-surface: '#f6eef7'
  outline: '#7e7481'
  outline-variant: '#cfc2d1'
  surface-tint: '#7e45a0'
  primary: '#470869'
  on-primary: '#ffffff'
  primary-container: '#5f2781'
  on-primary-container: '#d496f8'
  inverse-primary: '#e5b4ff'
  secondary: '#755a18'
  on-secondary: '#ffffff'
  secondary-container: '#fed889'
  on-secondary-container: '#785d1a'
  tertiary: '#3f1a57'
  on-tertiary: '#ffffff'
  tertiary-container: '#57326f'
  on-tertiary-container: '#ca9ee4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#f5d9ff'
  primary-fixed-dim: '#e5b4ff'
  on-primary-fixed: '#30004b'
  on-primary-fixed-variant: '#642c86'
  secondary-fixed: '#ffdf9d'
  secondary-fixed-dim: '#e6c275'
  on-secondary-fixed: '#251a00'
  on-secondary-fixed-variant: '#5b4300'
  tertiary-fixed: '#f4d9ff'
  tertiary-fixed-dim: '#e3b5fd'
  on-tertiary-fixed: '#2d0646'
  on-tertiary-fixed-variant: '#5c3774'
  background: '#fff7ff'
  on-background: '#1d1a20'
  surface-variant: '#e8e0e9'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Geist
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.01em
  title-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.005em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2rem
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
  space-3xl: 3rem
---

## Brand & Style
This design system is tailored for an institutional, agentic AI-powered academic discovery engine and literature review bench. The emotional objective is that of a calm, high-precision optical laboratory instrument: rigorously objective, unhurried, authoritative, and intellectual.

The visual direction rejects glowing neon gradients, particle effects, and colloquial chatbot tropes. Instead, it relies on structured information density, precise typographic alignment, subtle tonal segmentation, and institutional sobriety. The experience elevates scholar workflow efficiency through compact literature matrices, clear synthesis trees, and transparent agentic provenance tracking.

### Design Movement
**Academic Precision Modernism:** A hybrid of classical institutional dignity and contemporary computational tool design. Clean structural planes, crisp hair-thin dividers, disciplined hierarchy, and generous reading cadence allow high-density tabular synthesis to coexist effortlessly with long-form prose analysis.

## Colors
The color architecture applies a strict 70-20-10 operational balance designed to support extended hours of literature analysis without optical fatigue.

### Color Roles
- **Canvas & Surface Layering (70%):** Pristine background layers utilize pure white (`#FFFFFF`) alongside ultra-soft canvas fills (`#FCFCFD`, `#FAF7FC`). Cards and table panels default to pure white with structural lavender-gray boundaries (`#E7E1EA`) to prevent stark harshness.
- **Institutional Core (20%):** Deep academic purple (`#5F2781`) and profound plum (`#3F1A57`) anchor interactive controls, active navigation nodes, filter pills, primary progress bars, and citation node links. Tonal backgrounds use soft lavender washes (`#F3ECF8`, `#FAF7FC`) for active row selections and citation hover targets.
- **Academic Accent (10%):** Warm institutional gold (`#8D702C`) is reserved strictly for high-value scholarly signifiers: verified peer-review badges, high-citation benchmarks (top percentile markers), and authoritative methodology badges. Never used for standard primary actions.
- **Typography & Neutrals:** Primary body text uses deep charcoal-ink (`#17141A`) ensuring AAA contrast. Secondary metadata, author listings, and DOI captions use calibrated graphite (`#68636D`). Inactive elements and icon strokes leverage neutral silver (`#C2C2C2`).
- **Subdued Semantic States:**
  - **Success / Validated:** Desaturated Forest (`#2F6F4E`, background `#EBF5F0`)
  - **Warning / Caveat:** Muted Ochre (`#8A6518`, background `#FBF6EA`)
  - **Critical / Contradiction:** Dry Crimson (`#943434`, background `#FAECEC`)

## Typography
Typography is tuned for technical legibility and structured metadata scanning. The pairings establish an uncompromising academic posture: `Geist` provides structural, engineering-grade clarity for view headings, metric summaries, and modal titles; `Inter` governs all discursive analytical prose, citation abstracts, and tabular cells.

### Hierarchy Guidelines
- **Paper Titles:** Rendered in `title-md` or `headline-sm`, using semi-bold weights with tight negative letter-spacing for crispness in list views.
- **Synthesis Abstracts:** Body prose defaults to `body-md` with an open `22px` line height for comfortable continuous reading across wide analysis panes.
- **Bibliographic Metadata:** Author rosters, venue names, volume indices, and publication dates strictly leverage `body-sm` and `label-md` in secondary text color (`#68636D`).
- **Quantitative Metrics:** Impact metrics, citation counts, and extraction confidence percentages use tabular lining figures enabled via OpenType features (`tnum`).

## Layout & Spacing
The layout employs an asymmetric, utility-driven multi-pane layout calibrated for academic comparative review:
- **Left Panel (280px–320px fixed):** Search history, saved query libraries, project collections, and agent execution parameters.
- **Center Canvas (Fluid):** Primary comparative matrix table and paper discovery feed.
- **Right Panel (420px–560px expandable):** Deep inspection inspector for PDF full-text reading, extracted table comparisons, and agent methodology logs.

### Responsive Breakpoints & Grid Rhythm
- **Desktop (1280px and above):** 12-column fluid grid, `margin-desktop` (32px), `gutter-desktop` (24px). Three-pane split workspace fully unlocked.
- **Tablet / Laptop (768px – 1279px):** 8-column layout, `margin-tablet` (24px), `gutter` (16px). The inspection pane converts to an overlay slide-over panel to keep the matrix legible.
- **Mobile (< 768px):** 4-column layout, `margin` (16px), `gutter` (16px). Matrix switches to stacked paper summary cards; complex filters compress into a contextual bottom drawer.

## Elevation & Depth
In line with academic rigor, this design system completely eliminates high-blur ambient shadows and multi-colored luminescence. Visual depth is established through a strict hierarchy of **hairline structural borders** and **tonal surface stepping**.

### Depth Layers
- **Base Canvas (Level 0):** Background surface (`#FCFCFD`). Unbordered.
- **Interactive Planes (Level 1):** Main data tables, paper cards, and analytical panes sit on `#FFFFFF`, framed by a precise 1px solid border (`#E7E1EA`). No drop shadow.
- **Raised Interactive Units (Level 2):** Context menus, paper hover states, and dropdown selectors receive a micro-shadow: `0 2px 6px -1px rgba(23, 20, 26, 0.05), 0 1px 3px -1px rgba(23, 20, 26, 0.04)`, retaining the 1px `#E7E1EA` border.
- **Overlays & Dialogs (Level 3):** Modal document inspectors and agent query builders use: `0 12px 28px -4px rgba(23, 20, 26, 0.08), 0 4px 12px -2px rgba(23, 20, 26, 0.03)` with a neutral background scrim (`rgba(23, 20, 26, 0.45)` with `backdrop-filter: blur(2px)`).

## Shapes
To project deliberate scholarly composure, geometries sit strictly between `10px` and `14px` border-radius. This avoids the stark coldness of absolute rectangles while preventing the playful casualness of pill shapes.

### Shape Assignment
- **Primary Container Units (Paper cards, table frames, extraction panels):** `12px` border-radius (`0.75rem`).
- **Compact UI Elements (Inputs, buttons, dropdown triggers, popovers):** `10px` border-radius (`0.625rem`).
- **System Badges & Chips (Pills):** Fully rounded only for status and topic tokens (`9999px`), while metadata matrix tags retain `6px` radius to maintain a structural ledger feel.

## Components

### Buttons
- **Primary Action:** Solid `#5F2781` background, `#FFFFFF` label, border-radius `10px`. Hover: `#3F1A57`. Active: transform scale `0.99`. Never utilizes bright drop glows.
- **Secondary Action:** `#FFFFFF` background, 1px border `#E7E1EA`, `#17141A` text. Hover: `#FAF7FC` background with `#5F2781` border.
- **Tertiary / Ghost:** Transparent background, `#68636D` text. Hover: `#F3ECF8` background, `#5F2781` text.
- **Agent Run Button:** Distinct solid `#3F1A57` with an integrated mini status dot indicator (white or soft amber) signaling run states.

### Chips & Metadata Badges
- **Field / Domain Tag:** `#FAF7FC` background, `#5F2781` text, subtle `1px` border in `#E7E1EA`.
- **Verified Benchmark / Top Citation Badge:** Warm gold tint (`#FBF6EA` background, `#8D702C` text and icon, border `rgba(141, 112, 44, 0.2)`).
- **Extracted Factor / Variable Chip:** Compact `11px` font, 4px vertical padding, 8px horizontal, `#FFFFFF` with neutral gray border (`#E7E1EA`).

### Academic Literature Matrix (Data Table)
- **Container:** Pure `#FFFFFF` fill with `12px` roundedness and `1px` outline `#E7E1EA`.
- **Header:** Background `#FAF7FC`, bottom border `1px` solid `#E7E1EA`. Column labels in `label-sm` uppercase with tracking `0.04em` in `#68636D`.
- **Rows:** Alternating hover state with `#FAF7FC`. Selected row for cross-paper analysis tinted in `#F3ECF8` with a 2px vertical indicator bar in primary `#5F2781` along the row's left edge.
- **Cell Padding:** Dense vertical rhythm (`10px 14px`) to ensure rapid comparative ingestion.

### Input Fields & Query Consoles
- **Search & Filter Bars:** Background `#FFFFFF`, 1px border `#E7E1EA`, placeholder `#68636D`. Focus state uses `#5F2781` ring (`0 0 0 2px #F3ECF8`) and border `#5F2781`.
- **Agent Reasoning Input:** Multi-line text field featuring an integrated toolbar at the bottom for inclusion/exclusion criteria chips and year range sliders.

### Cards & Synthesis Units
- **Paper Result Card:** Surface `#FFFFFF`, border `1px` solid `#E7E1EA`, border-radius `12px`. Features a top-line bibliographic header, expandable key takeaway block wrapped in `#FAF7FC` with an inset left boundary (`#5F2781`, 3px wide).
- **Agent Synthesis Panel:** Bordered container with subtle `#FAF7FC` header strip highlighting model provenance, source count, and synthesis confidence.