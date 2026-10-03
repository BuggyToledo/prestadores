---
name: Modern Syndic Directory
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#534434'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#867461'
  outline-variant: '#d8c3ad'
  surface-tint: '#855300'
  primary: '#855300'
  on-primary: '#ffffff'
  primary-container: '#f59e0b'
  on-primary-container: '#613b00'
  inverse-primary: '#ffb95f'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#006e2d'
  on-tertiary: '#ffffff'
  tertiary-container: '#4ac86a'
  on-tertiary-container: '#004f1f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffddb8'
  primary-fixed-dim: '#ffb95f'
  on-primary-fixed: '#2a1700'
  on-primary-fixed-variant: '#653e00'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#7ffc97'
  tertiary-fixed-dim: '#62df7d'
  on-tertiary-fixed: '#002109'
  on-tertiary-fixed-variant: '#005320'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
  brand-gold-dark: '#D97706'
  brand-gold-light: '#FEF3C7'
  navy-surface: '#1E293B'
  navy-deep: '#0B132B'
  whatsapp-green: '#22C55E'
  surface-bg: '#F8FAFC'
  card-bg: '#FFFFFF'
  border-subtle: '#E2E8F0'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 26px
    letterSpacing: -0.01em
  title-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '700'
    lineHeight: 20px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system modernizes the digital service catalog specifically crafted for condominium managers (*síndicos*), property managers, and building administrators. It balances operational authority with quick mobile utility. The personality is trustworthy, pragmatic, highly legible, and immediate—minimizing friction between identifying a building emergency or maintenance requirement and contacting a verified professional.

The visual style blends modern corporate clarity with tactile, mobile-first utility. High-contrast typography paired with deep navy backgrounds gives the impression of institutional reliability, while warm amber/golden accents command immediate attention for search and primary service identification. Dedicated high-visibility green triggers instant direct action via WhatsApp. Cards and interactive modules utilize generous corner radii, subtle diffuse shadows, and crisp pill badges to prioritize rapid scanning under urgent field conditions.

## Colors

The palette reinforces clear semantic roles across every screen:

- **Primary (Vibrant Amber/Gold - `#F59E0B` & `#D97706`):** Reserved for core search actions, hero accents, category icons, rating stars, and admin portal promotion. Tonal variants (`#FEF3C7`) serve as luminous backgrounds for icons and tags.
- **Secondary (Deep Navy - `#0F172A`, `#1E293B`, `#0B132B`):** Acts as the foundational grounding color for headers, navigation drawers, authoritative administrative banners, and high-emphasis typography.
- **Tertiary (Communication Green - `#16A34A` & `#22C55E`):** Exclusively designated for instant communication triggers, specifically one-tap WhatsApp dispatch buttons and verified status indicators.
- **Neutrals & Surfaces (`#F8FAFC`, `#FFFFFF`, `#64748B`, `#E2E8F0`):** Soft, clean, low-strain backdrop shades that elevate card surfaces and maintain high readability in daylight conditions during on-site inspections.

## Typography

The design system standardizes on **Plus Jakarta Sans** across all roles to ensure geometric clarity, open apertures, and excellent legibility across varying mobile screens. 

- **Display & Headlines:** Heavy weights (`700` and `800`) provide authoritative weight on service titles, vendor names, and section headings.
- **Provider Names:** Formatted in uppercase bold (`title-sm`) to maximize recognizability and scan speed in condensed listings.
- **Badges & Micro-meta:** Styled with `label-sm` in all-caps or medium tracking (`+0.04em`) to establish visual separation from descriptive subtext.
- **Mobile Adaptability:** Body text never drops below 13px (`body-sm`) to preserve instant legibility for managers operating in noisy or low-light service rooms.

## Layout & Spacing

Layouts follow a fluid, mobile-first design centered on an 8-point vertical cadence (with 4px half-steps for fine alignment). 

- **Outer Margins:** Fixed at 16px (`1rem`) on standard mobile devices, expanding up to 24px (`1.5rem`) on tablets.
- **Grid Structure:** A 4-column layout on mobile devices transitioning into a 2-column card grid or 12-column desktop layout. Category selectors adopt a consistent 2-column square/card modular grid on mobile.
- **Touch Targets:** All primary interactive elements (call buttons, WhatsApp dispatches, search triggers) preserve a minimum height of 44px with a minimum separation of 8px (`space-sm`) to eliminate misclicks during one-handed use.

## Elevation & Depth

Visual hierarchy leverages crisp card containment and warm, tinted ambient drop shadows against the `#F8FAFC` foundation:

- **Level 0 (Flat/Subtle):** Inactive category tiles and input fields utilize a hairline border (`1px solid #E2E8F0`) with no shadow.
- **Level 1 (Card Default):** Service provider cards and floating panels use `0 2px 8px -2px rgba(15, 23, 42, 0.06), 0 1px 4px -1px rgba(15, 23, 42, 0.04)` to achieve crisp detachment from the canvas.
- **Level 2 (Hover/Active Floating):** Interactive actions, active cards, and promotional containers lift with `0 10px 25px -5px rgba(15, 23, 42, 0.10), 0 8px 10px -6px rgba(15, 23, 42, 0.04)`.
- **Level 3 (Dark Admin Panels):** Deep navy cards apply an inner highlight `inset 0 1px 0 0 rgba(255, 255, 255, 0.1)` combined with a soft navy halo shadow `0 20px 25px -5px rgba(11, 19, 43, 0.3)`.

## Shapes

The interface embraces modern, welcoming contours while retaining technical precision. 

- **Cards & Major Containers:** Styled with `rounded-2xl` (16px / `1rem`), delivering a friendly, modern mobile feel that frames each service provider neatly.
- **Buttons & Input Controls:** Built with medium roundedness (10px–12px) for structured, confident tapping boundaries.
- **Badges, Category Counters & Micro-tags:** Full pill radius (`rounded-full` / 9999px) to set visual distinction against square or semi-rounded service imagery and cards.
- **Icon Containers:** Soft squares with 12px rounding, providing balanced contrast to circular badges.

## Components

### Buttons & Quick Actions
- **Primary WhatsApp Trigger:** Solid `#16A34A` background with crisp white icon and text (`label-md`). Hover/press state shifts to `#15803D`. Features full-width dominance on mobile card footers or splits 70/30 alongside direct phone calls.
- **Search & Primary Submit:** Solid `#F59E0B` to `#D97706` amber gradient with bold text in `#0F172A` or `#FFFFFF` and right-aligned arrow glyph.
- **Secondary / Direct Phone Call:** Outlined or soft tinted button (`#F1F5F9`) with `#0F172A` icon, enabling immediate standard dialer access.

### Service Provider Cards
- **Architecture:** White surface (`#FFFFFF`) with 16px radius, subtle border (`#E2E8F0`), and Level 1 elevation.
- **Header:** Features a dual-row header displaying the category badge in soft amber (`bg-[#FEF3C7] text-[#B45309]`), sub-specialty tag, and verified status icon.
- **Body:** Company or professional name in `title-sm` (`#0F172A`), followed by location pin with neighborhood and city in `body-sm` (`#64748B`).
- **Footer:** Dual button arrangement: primary WhatsApp call-to-action button and auxiliary phone/details trigger.

### Category Grids
- **Style:** Compact dual-column modules with 12px internal padding.
- **Iconography:** Warm amber circle or rounded square (`#FEF3C7`) holding thematic outline icons in `#D97706`.
- **Counter Pill:** Top-right count badge (`#F1F5F9` text `#475569`) indicating total registered providers.

### Search & Filters
- **Input Fields:** Form controls with `#FFFFFF` background, 1px border (`#CBD5E1`), 12px radius, and dedicated prefix icons in amber or slate.
- **Filter Dropdowns:** Native-like mobile drawers or select lists displaying service category and city selector.

### Badges & Chips
- **Category Badge:** `#FEF3C7` background with `#92400E` text and 9999px border radius.
- **Sponsor / Ad Badge:** Dark translucent pill (`rgba(15, 23, 42, 0.75)`) layered over image headers with yellow indicator icon.