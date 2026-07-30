# ECL Frontend Design System

ECL uses Naive UI as the primary component library. Product pages should compose existing Naive UI components before introducing custom controls.

## Visual Principles

- Quiet surfaces: use a light canvas with white cards, or a dark canvas with graphite cards.
- Compact controls: standard controls are 36 px high with 6 px corner radii.
- Clear hierarchy: each page has one header, optional toolbar, and grouped content surfaces.
- Limited emphasis: reserve the primary color for selection, progress, and primary actions.
- Consistent spacing: prefer 4, 8, 12, 16, 24, and 32 px increments.

## Core Tokens

- Primary: `#5B6FF5`
- Light canvas: `#F4F6FA`
- Light surface: `#FFFFFF`
- Dark canvas: `#171A21`
- Dark surface: `#222630`
- Control radius: `6px`
- Card radius: `8px`
- Dialog radius: `10px`

## Page Composition

- `PageHeader`: page title, description, and primary actions.
- `SectionLayout`: pages with a stable secondary navigation.
- `.ecl-page`: full-page vertical layout.
- `.ecl-surface`: standard content surface.
- `.ecl-toolbar`: compact search and filter row.

Custom CSS should only handle page-specific layout. Component states, inputs, buttons, dialogs, menus, lists, tags, switches, sliders, and loading states should use Naive UI.
