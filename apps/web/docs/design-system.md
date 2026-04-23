# Design System

## Direction

The product uses a **warm stone** palette with **teal** as the primary
accent. The intended feeling is editorial, restrained, and premium — closer
to Linear, Stripe, and Things than to a generic SaaS template.

- Background: stone-50 / white
- Body text: stone-700 / stone-900
- Muted text: stone-500
- Borders: stone-200 / stone-100
- Primary accent: teal-600 (hover teal-500)
- Danger: red-600 with red-50 surfaces
- Success: emerald-500/600

## Tokens

Tokens live in `src/index.css` (CSS custom properties on `:root` and
`.dark`) and are wired into Tailwind via `tailwind.config.ts`. Use the
semantic class names (`bg-background`, `text-foreground`, `border-border`,
etc.) when possible. The shadcn primitives in `src/components/ui/*`
already do this.

## Typography

- **Sans (body)**: system stack via Tailwind defaults.
- **Serif (display)**: used sparingly for editorial moments such as the
  Create Workspace page title. Applied with `font-serif` and tracked
  tightly (`tracking-tight`).
- **Mono**: small caps / step labels (`font-mono text-[11px] tracking-[0.2em]
  uppercase`) for editorial wayfinding (e.g. "STEP 01 OF 03").

## Editorial restraint — Create Workspace

`src/components/workspace/create-wizard.tsx` was rebuilt to feel less
"AI-block" and more editorial:

- Single-column rhythm with generous vertical spacing.
- Serif display heading paired with mono step labels.
- Muted stone background, white card surfaces, restrained motion.
- No decorative gradients or stacked feature cards.

When designing future flows, lean on this template before reaching for
heavier visual devices.

## Admin identity

The admin console intentionally uses a **red accent** (red-600) on top of
the same warm stone base. This signals elevated permissions without
breaking the overall palette.

## Component hygiene

- Use shadcn primitives (`Button`, `Dialog`, `DropdownMenu`, etc.) from
  `src/components/ui/*` rather than building custom equivalents.
- Compose page-specific components in the appropriate folder
  (`components/workspace/`, `components/admin/`, …).
- Keep files under ~300 lines. The `transfer-ownership-dialog.tsx` file is
  approaching that limit and is a candidate to split (select step vs.
  confirm step) on the next touch.
