---
name: Explorador Intuitivo de SVM — Tutor MOCAVI
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#434655'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#a73a00'
  on-secondary: '#ffffff'
  secondary-container: '#fd651e'
  on-secondary-container: '#571a00'
  tertiary: '#006243'
  on-tertiary: '#ffffff'
  tertiary-container: '#007d57'
  on-tertiary-container: '#bdffdc'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#ffdbce'
  secondary-fixed-dim: '#ffb599'
  on-secondary-fixed: '#370e00'
  on-secondary-fixed-variant: '#7f2b00'
  tertiary-fixed: '#85f8c4'
  tertiary-fixed-dim: '#68dba9'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-hero:
    fontFamily: Outfit
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-hero-mobile:
    fontFamily: Outfit
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Outfit
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Outfit
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: 0em
  headline-md:
    fontFamily: Outfit
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-code-lg:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-code-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
  interactive-pill:
    fontFamily: Outfit
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The design system is crafted for high-school students (ages 14–15, 9th grade) entering the visual mechanics of Machine Learning without computational intimidation. The brand personality balances scientific rigor with game-like clarity: direct, approachable, tactile, and intellectually empowering. It replaces abstract algebraic intimidation with intuitive geometric analogies (e.g., dividing lines as "alleys/corridors", data clusters as distinct "neighborhoods", critical perimeter samples as "pillar anchors").

The visual direction follows a **Tactile-Minimalist** hybrid:
- Ultra-clean canvas dynamics with zero visual noise to minimize cognitive fatigue.
- High-contrast, mathematically distinct accent markers strictly fulfilling WCAG AAA accessibility thresholds.
- Crisp, physical-feeling interactive toggles, slider handles, and step cards that afford manipulation without clutter.
- Modular panels arranged in progressive disclosure patterns, ensuring that students never encounter raw parameter tables before physically dragging classification boundaries on a 2D plot.

## Colors

Color is deployed strictly as a cognitive teaching instrument rather than arbitrary decoration. The palette isolates mathematical concepts into consistent, unyielding color associations:

- **Canvas & Surface Architecture**:
  - Base Background: `#F8FAFC` (soft alabaster), preventing display glare during extended interactive sessions.
  - Surface Containers: `#FFFFFF` (pure white), crisp module surfaces creating clear foreground segregation.
  - Borders & Outlines: `#E2E8F0` (light structural slate), providing strict spatial partitioning without visual heaviness.
  - Neutral Typography & Controls: `#0F172A` (deep slate neutral), guaranteeing 7:1+ contrast on standard text.

- **Pedagogical Functional Anchors**:
  - **Class A ("Barrio Azul")**: Primary `#2563EB` (Interactive / Highlight `#1D4ED8`). Represents the first set of 2D data points.
  - **Class B ("Barrio Naranja")**: Secondary `#EA580C` (Interactive / Highlight `#C2410C`). Forms the opposing data distribution.
  - **Hyperplane / Optimal Boundary ("Pasillo Verde")**: Tertiary `#059669` (Subtle boundary surface `#10B981`, soft margin fill `#D1FAE5` at low opacity). Communicates maximum separation and stability.
  - **Support Vectors ("Vectores de Soporte / Puntos Clave")**: Accent Violet `#7C3AED` (Deep boundary `#6D28D9`). Denotes critical boundary instances with glowing ring strokes, signaling that only these points dictate the hyperplane.

Text over colored badges must consistently maintain WCAG AAA compliance: white text on dark states, `#0F172A` on pastel fills.

## Typography

The typographic hierarchy separates learning narrative from data observation:

1. **Outfit (Headlines & Interactive Pills)**: Geometric, friendly, and open. The wide apertures reduce reading fatigue for 9th graders, framing complex statistical concepts into digestible, energetic lessons.
2. **Inter (Body & Explanatory Context)**: Neutral, hyper-legible, and balanced. Handles multi-paragraph pedagogical walkthroughs, hints, and step-by-step guidance without drawing attention away from visual graphs.
3. **JetBrains Mono (Mathematical Parameters & Coordinates)**: Monospaced precision for vector equations, coordinate readouts (`[x1, x2]`), margin width $w$, and hyperparameter metrics ($C$, $\gamma$). Monospace rendering guarantees that shifting coordinate values do not jitter or destabilize UI modules during dynamic point dragging.

## Layout & Spacing

The layout model is split into an asymmetrical dual-zone workspace designed to maintain context:

- **Desktop (1024px and up)**: 12-column grid.
  - **Zone 1 (Interactive Canvas / Graph)**: Spans 7 or 8 columns. Maintains an explicit 1:1 or 4:3 Cartesian coordinate plane.
  - **Zone 2 (Tutor Control & Feedback Panel)**: Spans 4 or 5 columns. Houses narrative cards, hyperparameter sliders, step checkpoints, and live coordinate badges.
- **Tablet (768px – 1023px)**: 8-column layout. The graph retains prominent placement with a fixed minimum height of 420px; the control panel docks directly beneath.
- **Mobile (< 768px)**: 4-column single-stream stack with persistent bottom-docked step buttons and floating coordinate tooltips.

A consistent 8px rhythm governs internal module padding: `space-xs` (4px) for badge internals, `space-sm` (8px) for input clusters, `space-md` (16px) for module cards, and `space-xl` (40px) separating thematic lesson blocks.

## Elevation & Depth

To maintain clarity and support cognitive ergonomics, the design system avoids heavy drop shadows or skeumorphic skews. Depth is expressed through **structural layering and crisp border definitions**:

- **Level 0 (Canvas Base)**: `#F8FAFC`. Completely flat.
- **Level 1 (Card Modules & Graph Workspace)**: Surface `#FFFFFF` enclosed by a 1px solid border `#E2E8F0`. Features a faint, ambient floor shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.04)`.
- **Level 2 (Interactive Floating Badges & Tooltips)**: Surface `#FFFFFF` with border `#CBD5E1` and focused contact shadow: `0 4px 12px -2px rgba(15, 23, 42, 0.08)`.
- **Active / Drag State (Coordinate Points & Sliders)**: Elements receive an expanded focus aura matching their pedagogical color with a 3px ring at 20% opacity (e.g., `rgba(37, 99, 235, 0.2)` for Class A), delivering immediate physical confirmation of control.

## Shapes

The interface balances precision and warmth with an 8px (`0.5rem`) base corner radius:
- **Modules & Graph Containers**: 12px to 16px radius (`rounded-lg` to `rounded-xl`), creating distinct, approachable window boundaries.
- **Interactive Buttons & Controls**: 8px radius (`rounded-md`), offering clear affordance without looking toy-like.
- **Tags, Step Badges & Píldoras**: Pill-shaped (`rounded-full` / `9999px`), emphasizing their status as clickable or informative tokens.
- **Graph Data Points**: Circular geometries (16px diameter) with minimum 32px touch target bounds to allow effortless dragging on touch devices and trackpads.

## Components

### 1. Interactive Píldoras (Concept Badges)
- **Structure**: Rounded-full inline badges.
- **State Styling**:
  - Class A: Background `#EFF6FF`, Border `#BFDBFE`, Text `#1D4ED8`.
  - Class B: Background `#FFF7ED`, Border `#FED7AA`, Text `#C2410C`.
  - Hyperplane: Background `#ECFDF5`, Border `#A7F3D0`, Text `#047857`.
  - Support Vectors: Background `#F5F3FF`, Border `#DDD6FE`, Text `#6D28D9`.
- **Behavior**: Tapping a pill isolates and highlights that exact element in the 2D Cartesian plane, dimming all unrelated visual layers.

### 2. Primary & Secondary Buttons
- **Primary Action (e.g., "Calcular Margen Óptimo")**: Solid `#2563EB`, text `#FFFFFF`, font `Outfit` weight 600. Hover: `#1D4ED8`. Active: scale 0.98. Focus: 2px ring offset with `#93C5FD`.
- **Secondary Action (e.g., "Reiniciar Datos")**: White background `#FFFFFF`, 1px border `#E2E8F0`, text `#0F172A`. Hover: background `#F1F5F9`.

### 3. Sliders & Parameter Manipulators (Margin / Cost C / Kernel)
- **Track**: 6px height, rounded `#E2E8F0`. Active track fill in `#059669`.
- **Thumb**: 20px solid circle, `#FFFFFF` fill with 2.5px border `#059669`. Hover elevation `0 2px 6px rgba(0,0,0,0.15)`. Accompanied by a live `JetBrains Mono` numerical bubble above the thumb.

### 4. Interactive 2D SVM Canvas (Visualizer)
- **Background**: `#FFFFFF` with faint grid points at 20px increments `#F1F5F9`.
- **Data Nodes**: 14px circles. Class A (`#2563EB`), Class B (`#EA580C`).
- **Support Vector Callout**: Outer pulsing ring (24px) in `#7C3AED` with dashed perimeter when selected as an active margin constraint.
- **Hyperplane & Margin Corridors**: Continuous 2.5px solid line in `#059669`; upper and lower margin bounds represented by dashed 1.5px lines with soft gradient corridor fill `#D1FAE5` at 25% opacity.

### 5. Tutor Feedback & Step Cards
- **Container**: White surface with 4px left-border accent indicating system state (Green for "Margen Máximo Logrado", Orange for "Puntos Mezclados / Error").
- **Content**: Short, conversational feedback written for a 9th-grade reading level, accompanied by dynamic coordinate tags in `JetBrains Mono`.