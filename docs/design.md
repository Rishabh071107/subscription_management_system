# Brightloop --- Design System

> **Design direction:** Replicate the visual language and design rules
> of the supplied DealFlow360 design specification for Brightloop.
> Brightloop is a subscription-management platform for recurring
> billing, subscriptions, quotations, invoices, payments, discounts,
> taxes, and financial reporting.
>
> **Visual reference:** Odoo-inspired enterprise UI --- purple/plum
> brand accents, restrained neutral surfaces, crisp borders, clear
> typography, compact data layouts, and purposeful status colors.
>
> This document is the visual source of truth for the Brightloop
> application. All pages and feature modules must use these shared
> tokens and component patterns. Do not introduce unrelated visual
> themes or one-off styling.

------------------------------------------------------------------------

## 1. Visual Character

Brightloop must feel:

-   **Precise:** High information density, clean table alignment,
    readable financial values, and crisp borders.
-   **Trustworthy:** Clear status hierarchy, explicit policy
    explanations, predictable interaction states, and consistent
    feedback.
-   **Operational:** Optimized for Admins and Staff handling customers,
    subscriptions, quotations, invoices, and payments.
-   **Financially credible:** Unambiguous currency values, separate
    tax/discount/balance figures, and clear distinction between invoiced
    revenue and collected payments.
-   **Calm and intelligent:** Restrained purple/plum accents, neutral
    surfaces, balanced whitespace, and an 8px spacing rhythm.

### Visual principles

1.  Prefer structured enterprise layouts over decorative dashboard
    cards.
2.  Use purple/plum for brand identity and primary actions, not as a
    background for every section.
3.  Use white and soft neutral surfaces to keep tables and financial
    data readable.
4.  Use borders and spacing before shadows to separate content.
5.  Use status colors consistently and always pair them with text
    labels.
6.  Keep page titles, section headings, metrics, labels, and body text
    visually distinct.
7.  Avoid excessive gradients, glassmorphism, oversized rounded cards,
    unnecessary animations, and generic AI-generated dashboard patterns.
8.  Use charts only when they communicate meaningful subscription or
    financial trends.

------------------------------------------------------------------------

## 2. Color Tokens

### 2.1 Primary brand --- Odoo-inspired enterprise purple/plum

  -------------------------------------------------------------------------------
  Token             CSS variable              Hex value         Usage
  ----------------- ------------------------- ----------------- -----------------
  Primary           `--color-primary`         `#714B67`         Main brand color,
                                                                primary buttons,
                                                                active navigation

  Primary hover     `--color-primary-hover`   `#5F3D56`         Hover state for
                                                                primary actions

  Primary light     `--color-primary-light`   `#F3E9F1`         Selected rows,
                                                                active tabs,
                                                                subtle brand
                                                                surfaces

  Primary dark      `--color-primary-dark`    `#374151`         Dark accents and
                                                                high-contrast
                                                                headers
  -------------------------------------------------------------------------------

### 2.2 Secondary palette

  ---------------------------------------------------------------------------------
  Token             CSS variable                Hex value         Usage
  ----------------- --------------------------- ----------------- -----------------
  Secondary         `--color-secondary`         `#6C757D`         Secondary text,
                                                                  subtle icons,
                                                                  border accents

  Secondary light   `--color-secondary-light`   `#F8F9FA`         Table headers,
                                                                  neutral surfaces,
                                                                  secondary panels

  Secondary dark    `--color-secondary-dark`    `#374151`         Dark text
                                                                  emphasis and card
                                                                  headers
  ---------------------------------------------------------------------------------

### 2.3 Status and feedback colors

Status and risk must always be communicated with a text label and, where
useful, a numeric value or explanation. Never rely on color alone.

  --------------------------------------------------------------------------
  Token             Foreground        Soft backgrounds  Brightloop usage
  ----------------- ----------------- ----------------- --------------------
  Success           `#28A745`         `#DCFCE7`,        Active
                                      `#F0FDF4`         subscriptions, paid
                                                        invoices, successful
                                                        payments, approved
                                                        quotations

  Warning           `#F59E0B`         `#FEF3C7`,        Pending approvals,
                                      `#FFFBEB`         invoices due soon,
                                                        expiring plans,
                                                        review required

  Danger            `#DC3545`         `#FEE2E2`,        Overdue invoices,
                                      `#FEF2F2`         failed payments,
                                                        cancelled/rejected
                                                        records, blocked
                                                        actions

  Info              `#17A2B8`         `#E0F2FE`,        Draft progress,
                                      `#F0F9FF`         submitted
                                                        quotations,
                                                        processing states,
                                                        informational
                                                        notices
  --------------------------------------------------------------------------

### 2.4 Backgrounds and surfaces

  --------------------------------------------------------------------------
  Token             CSS variable         Hex value         Usage
  ----------------- -------------------- ----------------- -----------------
  Page background   `--color-bg-page`    `#FFFFFF`         Main application
                                                           viewport

  Surface           `--color-surface`    `#F8F9FA`         Cards, modal
                                                           content, section
                                                           panels

  Muted background  `--color-bg-muted`   `#F1F3F5`         Secondary fills,
                                                           disabled
                                                           controls, quiet
                                                           sections

  Sidebar           `--color-sidebar`    `#1E293B`         Internal
  background                                               application
                                                           sidebar
  --------------------------------------------------------------------------

### 2.5 Text colors

  --------------------------------------------------------------------------------
  Token             CSS variable               Hex value         Usage
  ----------------- -------------------------- ----------------- -----------------
  Primary text      `--color-text-primary`     `#212529`         Page titles, body
                                                                 text, table
                                                                 values

  Secondary text    `--color-text-secondary`   `#6C757D`         Subtitles, field
                                                                 labels, secondary
                                                                 data

  Muted text        `--color-text-muted`       `#ADB5BD`         Disabled text,
                                                                 placeholders,
                                                                 captions

  Inverse text      `--color-text-inverse`     `#FFFFFF`         Text on primary
                                                                 buttons and dark
                                                                 surfaces
  --------------------------------------------------------------------------------

### 2.6 Data visualization colors

  ------------------------------------------------------------------------------
  Token             CSS variable             Hex value         Brightloop usage
  ----------------- ------------------------ ----------------- -----------------
  Chart blue        `--color-chart-blue`     `#3B82F6`         Quotations,
                                                               customer growth,
                                                               pipeline volume

  Chart green       `--color-chart-green`    `#22C55E`         Collected
                                                               revenue,
                                                               successful
                                                               payments

  Chart orange      `--color-chart-orange`   `#F97316`         Pending invoices,
                                                               discounts,
                                                               upcoming renewals

  Chart purple      `--color-chart-purple`   `#8B5CF6`         Recurring
                                                               revenue, active
                                                               subscriptions

  Chart pink        `--color-chart-pink`     `#EC4899`         Exceptions,
                                                               failed renewals,
                                                               anomalies,
                                                               overrides
  ------------------------------------------------------------------------------

Charts must include readable labels, legends, and appropriate units. Do
not use chart colors as the only way to distinguish series.

------------------------------------------------------------------------

## 3. Elevation and Shadows

  --------------------------------------------------------------------------------------------------------------------------
  Token                   Box shadow                                                                 Application
  ----------------------- -------------------------------------------------------------------------- -----------------------
  `shadow-none`           `none`                                                                     Flat inputs, table
                                                                                                     rows, inline badges

  `shadow-sm`             `0 1px 2px 0 rgba(0, 0, 0, 0.05)`                                          Subtle button and input
                                                                                                     elevation

  `shadow-default`        `0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)`        Standard cards and
                                                                                                     section containers

  `shadow-md`             `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)`     Dropdowns, popovers,
                                                                                                     floating bars

  `shadow-lg`             `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)`   Modals, dialogs, drawer
                                                                                                     panels
  --------------------------------------------------------------------------------------------------------------------------

Use shadows sparingly. Prefer borders and surface contrast for ordinary
cards and data tables.

------------------------------------------------------------------------

## 4. Typography System

Brightloop uses a purposeful typography hierarchy rather than one font
size and weight everywhere.

### 4.1 Font families

  -----------------------------------------------------------------------
  Role                    Font                    Usage
  ----------------------- ----------------------- -----------------------
  Display and page        `Outfit`                Brand heading, page
  headings                                        titles, major section
                                                  headings

  Body and forms          `Inter`                 Paragraphs, form
                                                  values, table content,
                                                  helper text

  Navigation and labels   `DM Sans`               Sidebar navigation,
                                                  tabs, compact labels

  Metrics and financial   `Space Grotesk`         KPI values, totals,
  figures                                         balances, prominent
                                                  numeric data
  -----------------------------------------------------------------------

Use sensible system fallbacks. Load fonts centrally; feature modules
must not introduce their own font imports.

Suggested CSS stacks:

``` css
--font-heading: "Outfit", system-ui, sans-serif;
--font-body: "Inter", system-ui, sans-serif;
--font-ui: "DM Sans", system-ui, sans-serif;
--font-metric: "Space Grotesk", system-ui, sans-serif;
```

### 4.2 Weight scale

-   **Light (`300`):** Subtle captions and fine supporting text.
-   **Regular (`400`):** Body text, form values, and table values.
-   **Medium (`500`):** Navigation, labels, table headers, tabs, and
    badge labels.
-   **Semibold (`600`):** Card headers, section titles, and primary
    button text.
-   **Bold (`700`):** Page titles and key metric highlights.

### 4.3 Size and line-height scale

  ------------------------------------------------------------------------------
  Class                      Font size          Line height Recommended use
  --------------- -------------------- -------------------- --------------------
  `text-5xl`                      48px                 60px Rare display/brand
                                                            hero

  `text-4xl`                      36px                 44px Major dashboard
                                                            heading

  `text-3xl`                      30px                 38px Detail-page/entity
                                                            title

  `text-2xl`                      24px                 32px Card and major
                                                            section title

  `text-xl`                       20px                 28px Section title

  `text-lg`                       18px                 26px Subsection title

  `text-base`                     16px                 24px Standard body and
                                                            input text

  `text-sm`                       14px                 20px Form labels, table
                                                            content, secondary
                                                            text

  `text-xs`                       12px                 16px Captions, status
                                                            badges, helper text,
                                                            timestamps
  ------------------------------------------------------------------------------

Use `Space Grotesk` for important financial figures, with tabular
numerals enabled where possible. Keep dense management pages readable;
do not make every heading oversized.

------------------------------------------------------------------------

## 5. Spacing System --- 8px Grid

Use a consistent spacing rhythm across margins, padding, and component
gaps. A 4px micro-step is allowed.

  Token            Value Usage
  -------------- ------- ------------------------------------------
  `spacing-1`        4px Micro gaps, badge padding
  `spacing-2`        8px Small gaps, compact button spacing
  `spacing-3`       12px Form field padding, compact card gaps
  `spacing-4`       16px Standard container padding, form spacing
  `spacing-6`       24px Card padding, section gaps
  `spacing-8`       32px Major panel padding, grid spacing
  `spacing-12`      48px Page section margins
  `spacing-16`      64px Outer layout margins

Use tighter spacing for dense tables and filters, and larger spacing to
separate major page sections.

------------------------------------------------------------------------

## 6. Border Radius

  Token                 Value Applied elements
  ------------------ -------- ---------------------------------------
  `radius-none`           0px Full-bleed tables and grid dividers
  `radius-sm`             4px Tags, tooltips, compact status labels
  `radius-default`        6px Buttons, inputs, select boxes
  `radius-md`             8px Cards, dropdown menus, alert boxes
  `radius-lg`            12px Modals and major summary containers
  `radius-full`        9999px Avatars and circular indicators

Do not apply large rounded corners to every surface. Keep enterprise
tables and data-heavy views crisp.

------------------------------------------------------------------------

## 7. Borders and Dividers

-   **Default border:** `1px solid #E5E7EB` --- cards, table dividers,
    section boundaries.
-   **Hover border:** `1px solid #D1D5DB` --- interactive card and input
    hover states.
-   **Focus border:** `2px solid #714B67` --- focused inputs and active
    selection outlines.
-   **Error border:** `1px solid #DC3545` --- invalid form fields.

Keyboard focus must remain visible. Do not remove browser focus outlines
without replacing them with an accessible equivalent.

------------------------------------------------------------------------

## 8. Core Component Patterns

### 8.1 Buttons

-   **Primary:** `#714B67` background, `#FFFFFF` text, `#5F3D56` hover.
    Use for the main workflow action.
-   **Secondary:** `#F8F9FA` background, `1px solid #E5E7EB` border,
    `#212529` text.
-   **Success:** `#28A745` background with white text. Use only for
    explicit positive actions.
-   **Warning:** `#F59E0B` background with a text color selected for
    accessible contrast.
-   **Danger:** `#DC3545` background with white text. Use for
    destructive or rejection actions.
-   **Outline:** Transparent background, neutral border, primary text.
-   **Ghost:** Transparent background, secondary text, subtle neutral
    hover surface.

Every button must support: - Default, hover, focus, disabled, and
loading states. - Clear action labels. - Keyboard interaction. -
Confirmation for irreversible or consequential actions.

Use one visually dominant primary action per form or workflow section
wherever practical.

### 8.2 Status badges and tags

  -----------------------------------------------------------------------
  Status family     Background        Text              Example
                                                        Brightloop states
  ----------------- ----------------- ----------------- -----------------
  Draft / inactive  `#F1F3F5`         `#6C757D`         Draft quotation,
                                                        inactive customer

  Submitted / in    `#E0F2FE`         `#17A2B8`         Submitted
  progress                                              quotation,
                                                        processing
                                                        payment

  Under review /    `#FEF3C7`         `#92400E`         Pending approval,
  pending                                               payment pending

  Approved / paid / `#DCFCE7`         `#166534`         Approved
  active                                                quotation, paid
                                                        invoice, active
                                                        subscription

  Rejected /        `#FEE2E2`         `#991B1B`         Rejected
  overdue / failed                                      quotation,
                                                        overdue invoice,
                                                        failed payment
  -----------------------------------------------------------------------

Map each actual business status consistently. Do not treat `ACTIVE`
subscription status as proof that an invoice is paid.

### 8.3 Banners and alerts

-   **Success:** Green border `#28A745`, soft green background
    `#F0FDF4`, text `#166534`.
-   **Warning:** Amber border `#F59E0B`, soft yellow background
    `#FFFBEB`, text `#92400E`.
-   **Error:** Red border `#DC3545`, soft red background `#FEF2F2`, text
    `#991B1B`.
-   **Information:** Blue border `#17A2B8`, soft blue background
    `#F0F9FF`, text `#075985`.

An alert must explain what happened and, where possible, what the user
can do next.

### 8.4 Forms and validation

-   Keep labels visible; do not use placeholders as the only labels.
-   Clearly identify required fields.
-   Show validation messages close to the affected field.
-   Preserve entered values after recoverable errors.
-   Prevent duplicate submissions while requests are pending.
-   Use consistent date, currency, percentage, and number formatting.
-   Distinguish read-only, disabled, invalid, and loading states.
-   Use accessible focus and error messaging.

### 8.5 Tables and data lists

Tables are central to Brightloop's operational experience.

-   Right-align currency, amount, percentage, and quantity columns.
-   Use tabular numerals for financial values.
-   Keep headers visually distinct from row content.
-   Use consistent row heights and subtle separators.
-   Provide search, filters, sorting, and pagination where appropriate.
-   Keep row actions discoverable without overcrowding each row.
-   Support horizontal overflow on narrow screens.
-   Include deliberate loading, empty, error, and no-results states.

### 8.6 Financial presentation

Financial information must be unambiguous:

-   Display currency symbol/code consistently.
-   Separate invoice total, tax, discount, amount paid, and outstanding
    balance.
-   Distinguish **invoiced value** from **payments actually collected**.
-   Use explicit labels for recurring revenue and one-time amounts.
-   Show due dates and overdue indicators clearly.
-   Never use color alone to communicate financial state.
-   Keep decimal precision and rounding consistent across the
    application.

------------------------------------------------------------------------

## 9. Application Layouts

### 9.1 Public authentication layout

Used by Login, Signup, Forgot Password, and Reset Password.

-   Focused page with Brightloop brand identity.
-   Responsive authentication panel.
-   Minimal navigation and no internal sidebar.
-   Clear form hierarchy and feedback messages.
-   Purple primary action and neutral supporting surfaces.

### 9.2 Internal application layout

Used by Admin and Staff.

-   Dark sidebar using `--color-sidebar`.
-   Main content on `--color-bg-page`.
-   Top navigation for breadcrumbs, page actions, and user menu.
-   Consistent content width, page padding, and section spacing.
-   Navigation grouped by business area.
-   Navigation items filtered according to the user's role.
-   Active navigation state uses the primary brand treatment.
-   Sidebar collapses on smaller screens.

The Admin and Staff interfaces should share the same design system while
exposing only the navigation and actions permitted to each role.
Frontend hiding is not a replacement for backend authorization.

### 9.3 Customer portal layout

-   Separate customer-facing navigation from the internal workspace.
-   Simpler navigation focused on profile, quotations, subscriptions,
    invoices, and payments.
-   Clear account identity and sign-out access.
-   Customer-specific data and actions only.
-   Do not expose internal operational controls or staff navigation.

------------------------------------------------------------------------

## 10. Page-Specific Visual Guidance

### Dashboard

-   Use a clear page heading and concise context.
-   KPI cards should be compact and comparable.
-   Use `Space Grotesk` for key metric values.
-   Separate revenue collected, invoiced amount, outstanding balance,
    and overdue amount.
-   Use charts only when they provide useful trend or category
    information.
-   Keep recent activity and actionable items easy to scan.

### List and management pages

Examples: Customers, Staff, Products, Plans, Quotations, Subscriptions,
Invoices, Discounts, and Payments.

-   Place page title and primary action at the top.
-   Place search and filters in a consistent toolbar.
-   Use dense but readable tables.
-   Use status badges and consistent row actions.
-   Provide pagination and clear empty states.
-   Avoid placing every row inside a separate rounded card.

### Detail pages

Examples: Product details, Plan details, Subscription details, Invoice
details.

-   Show the record identifier and status near the title.
-   Group related information into clearly named sections.
-   Keep important actions visible and permission-aware.
-   Present financial breakdowns in aligned rows.
-   Show activity/history in a readable timeline when supported.

### Create and edit forms

-   Group related fields into sections.
-   Use consistent label, input, helper, and error styles.
-   Keep primary and secondary actions in predictable locations.
-   Clearly distinguish editable fields from calculated or read-only
    values.
-   Do not overwhelm users with every advanced option at once.

------------------------------------------------------------------------

## 11. Responsive Behavior

-   **Desktop:** Persistent sidebar, full data tables, multi-column
    forms where appropriate.
-   **Tablet:** Collapsible sidebar, responsive content grids, compact
    filter layouts.
-   **Mobile:** Compact navigation, stacked forms, and horizontally
    scrollable data tables where necessary.
-   Essential actions and status information must remain accessible at
    every viewport size.
-   Modals and drawers must fit within the viewport and remain keyboard
    accessible.
-   Avoid horizontal page overflow; constrain overflow to the relevant
    table or data region.

------------------------------------------------------------------------

## 12. Accessibility Requirements

-   Maintain readable text and control contrast.
-   Provide visible keyboard focus.
-   Use semantic headings and form labels.
-   Associate validation messages with their inputs.
-   Ensure actions are keyboard operable.
-   Provide text labels alongside status colors and chart legends.
-   Respect reduced-motion preferences.
-   Do not communicate important information through color alone.
-   Use meaningful accessible names for icon-only controls.

------------------------------------------------------------------------

## 13. Centralized Implementation

Implement the design system centrally in:

`apps/web/src/styles/index.css`

Use CSS custom properties and the project's Tailwind CSS theme bindings.
Shared components must consume these tokens rather than hardcoding
repeated values.

### 13.1 CSS token reference

``` css
:root {
  /* Brand */
  --color-primary: #714B67;
  --color-primary-hover: #5F3D56;
  --color-primary-light: #F3E9F1;
  --color-primary-dark: #374151;

  /* Secondary */
  --color-secondary: #6C757D;
  --color-secondary-light: #F8F9FA;
  --color-secondary-dark: #374151;

  /* Status */
  --color-success: #28A745;
  --color-warning: #F59E0B;
  --color-danger: #DC3545;
  --color-info: #17A2B8;

  /* Surfaces */
  --color-bg-page: #FFFFFF;
  --color-surface: #F8F9FA;
  --color-bg-muted: #F1F3F5;
  --color-sidebar: #1E293B;

  /* Text */
  --color-text-primary: #212529;
  --color-text-secondary: #6C757D;
  --color-text-muted: #ADB5BD;
  --color-text-inverse: #FFFFFF;

  /* Borders */
  --border-default: #E5E7EB;
  --border-hover: #D1D5DB;
  --border-focus: #714B67;
  --border-danger: #DC3545;

  /* Radius */
  --radius-sm: 4px;
  --radius-default: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* Typography */
  --font-heading: "Outfit", system-ui, sans-serif;
  --font-body: "Inter", system-ui, sans-serif;
  --font-ui: "DM Sans", system-ui, sans-serif;
  --font-metric: "Space Grotesk", system-ui, sans-serif;
}
```

### 13.2 Implementation rules

1.  Define tokens once; do not duplicate them in feature-level
    stylesheets.
2.  Create shared Button, Input, Select, Badge, Alert, Card, Table,
    Modal, and PageHeader components.
3.  Keep shared components independent of business-module logic.
4.  Feature modules may compose shared components but must not redefine
    the design language.
5.  Use consistent formatting utilities for currency, dates,
    percentages, and numeric values.
6.  Do not add a new color, font, shadow, or radius token without
    updating this document and obtaining approval.

------------------------------------------------------------------------

## 14. Design Acceptance Checklist

-   [ ] Brightloop uses the supplied DealFlow360 Odoo-inspired visual
    direction.
-   [ ] Purple/plum brand colors match the documented tokens.
-   [ ] Neutral backgrounds and dark internal sidebar are consistent.
-   [ ] Typography uses Outfit, Inter, DM Sans, and Space Grotesk for
    their defined purposes.
-   [ ] Spacing follows the documented 8px rhythm.
-   [ ] Borders, shadows, and radius values are consistent.
-   [ ] Buttons include hover, focus, disabled, and loading states.
-   [ ] Forms include visible labels and validation feedback.
-   [ ] Tables align financial and numeric values correctly.
-   [ ] Status indicators include text labels.
-   [ ] Dashboard distinguishes collected revenue from invoiced value.
-   [ ] Internal and customer layouts are visually distinct.
-   [ ] Responsive behavior works on desktop, tablet, and mobile.
-   [ ] Keyboard navigation and focus indicators are usable.
-   [ ] Feature modules do not introduce unapproved visual styles.
