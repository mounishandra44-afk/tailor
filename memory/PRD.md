# Product Requirements Document (PRD)

## Original Problem Statement
- "build the same kind of application both backend and frontend"
- User clarified: "i want all the features that are present in that image"

## Current Date
- 2026-03-12

## User Persona
1. **Primary Persona: Tailor Shop Customer**
   - Wants to view services, browse design gallery, share design references, and quickly book appointments.
2. **Secondary Persona: Tailor Studio Owner**
   - Wants customer inquiries and bookings stored reliably in backend DB for follow-up.

## Core Requirements (Static)
- Build a full-stack tailor website matching the reference structure:
  - Sticky navbar
  - Hero section with CTA buttons (Book Appointment, WhatsApp Order)
  - About section
  - Services cards
  - Gallery with category filters
  - Upload Your Design form
  - Before & After interactive section
  - Contact section with map and details
  - Book Appointment form
  - Footer
- Backend + frontend both required.
- Use React frontend, FastAPI backend, MongoDB storage.

## Architecture Decisions
- **Frontend:** React (single-page section-based flow), shadcn/ui components, custom CSS theme aligned to luxury tailor aesthetic.
- **Backend:** FastAPI with `/api` router.
- **Database:** MongoDB via Motor using `MONGO_URL` from environment.
- **Data Model Strategy:**
  - Static content endpoints for services/gallery/contact.
  - Persistent collections for `design_requests` and `appointments`.
- **API Usage:** Frontend calls backend via `REACT_APP_BACKEND_URL` only.

## Implemented Features (with Date)
### 2026-03-12
- Built complete tailor website frontend with all requested sections.
- Implemented sticky navigation and smooth anchor-based movement across sections.
- Added hero CTAs including WhatsApp deep link generation.
- Added services grid rendered from backend API.
- Added gallery with category tabs: All / Men's / Women's / Bridal.
- Added Upload Your Design form with file selection UI + backend submission.
- Added interactive Before & After slider block.
- Added Contact panel with phone/email/hours/address + embedded map.
- Added Appointment Booking form with backend submission.
- Added toast notifications for form success/failure feedback.
- Added robust `data-testid` attributes on interactive and critical UI elements.
- Built FastAPI endpoints:
  - `GET /api/`
  - `GET /api/content/services`
  - `GET /api/content/gallery`
  - `GET /api/content/contact`
  - `POST /api/design-requests`
  - `GET /api/design-requests`
  - `POST /api/appointments`
  - `GET /api/appointments`
- Ensured Mongo-safe responses (excluded `_id`, normalized datetime/date parsing).
- Fixed broken gallery image source and added frontend `onError` image fallback.

## Validation & Testing Status
- Backend curl tests passed for all major endpoints.
- Frontend screenshot flows verified: nav, gallery tabs, form interactions.
- Testing agent iteration completed; reported one image issue which is fixed.

## Prioritized Backlog
### P0 (Must-have next)
- Add lightweight admin view (protected route) to inspect submitted design requests and appointments.
- Add server-side phone format validation and anti-spam throttling for forms.

### P1 (Should-have)
- Add image upload storage for design files (instead of filename-only metadata).
- Add appointment slot availability logic and conflict prevention.
- Add backend pagination/filtering for admin listing endpoints.

### P2 (Nice-to-have)
- Add testimonials and client review carousel.
- Add SMS/WhatsApp booking confirmation workflows.
- Add SEO metadata and structured local business schema.

## Next Tasks List
1. Build basic admin dashboard page for incoming submissions.
2. Add secure authentication for admin access.
3. Add cloud file upload for user design images.
4. Improve conversion with sticky floating WhatsApp/Call quick actions.
