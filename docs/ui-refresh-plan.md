# LeaveBot UI Refresh Plan

## Vision
Deliver a modern, polished, and responsive experience that makes leave management fast, delightful, and trustworthy for admins, leaders, and employees alike. The refreshed UI should feel like an enterprise-grade SaaS product, while staying lightweight and easy to navigate.

## Core Design Principles
- **Clarity first** – prioritize legibility, clear hierarchy, and contextual cues (badges, color states, tooltips).
- **Guided workflows** – highlight primary actions, surface status updates, and reduce clicks.
- **Consistency** – shared layout primitives (cards, panels, tables, modals) with a cohesive visual language.
- **Responsiveness** – fully adaptive layouts for desktops, tablets, and phones (sidebar collapses, cards stack).
- **Accessibility** – WCAG-compliant contrast, semantic markup, focus indicators, keyboard friendly.

## Visual Language
- **Color palette**: indigo/blue primary, emerald success, amber warning, rose danger, slate neutrals.
- **Typography**: Tailwind defaults (Inter/variable fonts) with tight line heights, bold headers, medium body.
- **Elevation**: soft shadows, subtle gradients, frosted-glass overlays for modals.
- **Iconography**: `lucide-react` to provide consistent, stroked icons.

## Layout System
- **App Shell**: persistent left sidebar (collapsible) + top header bar showing greeting, quick actions, and user menu.
- **Main Content**: max-width container with responsive grid for dashboard cards and detail panels.
- **Auth Pages**: full-height split layout with marketing panel (illustration + value props) and auth card.

## Component Architecture
- `AppLayout`: wraps authenticated screens with sidebar + header.
- `SidebarNav`: grouped navigation (Dashboard, Calendar, Leave List, Request Leave, Teams, Users, Settings).
- `PageHeader`: title, breadcrumb, description, contextual action buttons.
- `MetricCard`: consistent stat display with icon, delta, tooltip.
- `DataTable`: stylized table for users/leaves with integrated filters, search, pagination.
- `ModalSheet`: animated dialog for forms (create team, add user, edit leave) with form validation + loading states.
- `StatusBadge`, `RoleBadge`, `Avatar`, `EmptyState`, `LoadingState`, `Toast` components.

## Screen Enhancements
- **Dashboard**: KPI cards, leave balance widget, approval queue, activity timeline, quick actions.
- **Calendar**: tabs for team vs. personal, filter chips (status/team/member), modal detail panel (instead of alert), export button.
- **Leave List**: searchable/filterable table, bulk actions (approve/reject), CSV export, status chips.
- **Request Leave**: stepper form with validation, preview summary, policy hints.
- **Teams Management**: grid/list toggle, leader avatar, member counts, drag-and-drop or multi-select assignment, filter by leader.
- **User Management**: improved table, inline role badges, quick actions, password reset link, invite flow.

## Interaction Enhancements
- Global toast/notification system for success/error.
- Skeleton loaders + shimmer placeholders while fetching.
- Confirmation modals with detailed consequences.
- Keyboard shortcuts for power users ("/" to search, "L" to open leave form).

## Technical Stack Updates
- Integrate **Tailwind CSS** + custom theme tokens.
- Add **lucide-react** for icons.
- Optional: `@headlessui/react` for accessible modals/menus and `clsx` for class composition.
- Introduce central `ui` module for reusable primitives.

## Responsive Strategy
- Sidebar collapses to icon rail on < 1280px, becomes slide-over drawer on < 768px.
- Cards and tables transform into stacks with accordions on small screens.
- Forms use single-column layout on mobile with sticky submit actions.

## Rollout Phases
1. **Foundation** – Tailwind setup, layout shell, typography/colors.
2. **Core Screens** – Dashboard + Calendar + Auth redesign.
3. **Management Tools** – User + Team management revamp.
4. **Advanced UX** – Toasts, skeletons, keyboard shortcuts, analytics.
5. **Feature Growth** – Notifications, reports, SLA tracking, integrations.

## Metrics for Success
- Reduced time-to-approve leave (fewer clicks, clearer CTA).
- Higher adoption of team assignment (clear flows, visibility).
- Decreased support requests (transparent errors, guidance).
- Positive qualitative feedback from admins/leaders/users.

## Recommended Future Features
- Role-based analytics dashboard (per-team headcount, leave trends, burnout risk).
- Leave balance tracking with policy rules + accrual engine.
- Workflow automation (multi-step approval chains, delegation).
- Notifications (email + in-app toasts) and Slack/MS Teams integrations.
- Self-service profile management + document attachments for leave proof.
- Reporting center with exports, scheduled reports, and API access.
- Audit trail + activity feed for compliance.
- PTO blackout periods + capacity planning heatmaps.

---
This plan guides the upcoming implementation tasks and ensures every screen aligns with the new design language.
