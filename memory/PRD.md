# Product Requirements Document (PRD)

## Original Problem Statement
- "build the same kind of application both backend and frontend"
- User intent: match the tailor website reference and include all visible sections/features.

## User Personas
1. **Tailor Customers (Public Users)**
   - Browse designs and gallery.
   - Submit design requests.
   - Book appointments and place orders.
2. **Tailor Studio Admin**
   - Login securely.
   - Upload/manage designs shown on user page.
   - Track and update appointment/order statuses.

## Architecture Decisions
- **Frontend:** React + React Router (public + admin routes), shadcn/ui primitives, sonner toasts.
- **Backend:** FastAPI + MongoDB (Motor) with `/api` namespace.
- **Persistence:** Mongo collections for admin users, designs, appointments, orders, and design requests.
- **Auth:** JWT-based admin auth with protected dashboard route.
- **Data flow:** Admin-managed designs are fetched on user homepage and used for booking/order actions.

## Core Requirements (Static)
- Tailor storefront sections (hero, about, designs/services, gallery, upload design, before/after, contact, booking).
- User actions: book appointment and place order.
- Admin system: login, forgot password reset/update, dashboard with:
  - Manage Designs
  - Manage Appointments
  - Manage Orders
  - Stats cards (today bookings, pending, totals)
- Admin status workflow support: pending / confirmed / rejected / completed / cancelled.

## What Has Been Implemented
### 2026-03-12 (Phase 1)
- Built full user-facing tailor website with premium styling and all reference sections.
- Added working forms and Mongo persistence for upload design requests + appointment booking.
- Added content APIs and connected frontend to backend.

### 2026-03-13 (Phase 2)
- Added complete admin authentication flow:
  - Admin login
  - Forgot password (reset code generation)
  - Reset password update
- Added protected admin dashboard route.
- Added admin dashboard modules:
  - Stats cards
  - Design management (create, activate/deactivate, delete)
  - Appointment management with status updates
  - Order management with status updates
- Added public order flow (`/api/orders`) and UI order form.
- Linked user design cards with actions:
  - Book Appointment
  - Place Order
- Implemented dynamic public designs from admin-managed database entries.
- Added robust frontend and backend data-testid coverage and responsive UI behavior.
- Completed backend + frontend testing with testing agent (iteration_2: 100% backend, 100% frontend).

## Current API Surface (High-level)
- Public:
  - `GET /api/content/contact`
  - `GET /api/content/designs`
  - `GET /api/content/services`
  - `GET /api/content/gallery`
  - `POST /api/design-requests`
  - `POST /api/appointments`
  - `POST /api/orders`
- Admin Auth:
  - `POST /api/admin/auth/login`
  - `POST /api/admin/auth/forgot-password`
  - `POST /api/admin/auth/reset-password`
  - `GET /api/admin/me`
- Admin Dashboard Data:
  - `GET /api/admin/stats`
  - `GET/POST/PUT/DELETE /api/admin/designs...`
  - `GET /api/admin/appointments`
  - `PATCH /api/admin/appointments/{id}/status`
  - `GET /api/admin/orders`
  - `PATCH /api/admin/orders/{id}/status`

## Prioritized Backlog
### P0
- Add dedicated `JWT_SECRET` environment variable for stronger auth hardening.
- Add stronger password policy + lockout/rate-limit on auth endpoints.

### P1
- Add true file-storage pipeline for admin design uploads (cloud/object storage).
- Add appointment calendar-slot conflict prevention.
- Add search/filter/pagination on admin tables.

### P2
- Add customer notification automation (WhatsApp/SMS/email) on status changes.
- Add downloadable reports for appointments/orders.
- Add audit log for admin actions.

## Next Tasks
1. Security hardening pass (JWT secret env + auth throttling).
2. Cloud image upload integration for production-grade design media.
3. Enhanced admin productivity tools (filters, export, bulk actions).
4. Conversion optimization on user side (sticky quick actions and social proof).

_Last updated: 2026-03-13_
