# 🎵 TicketFlow — Concert Ticket Booking App

A full-stack concert ticket booking system: **React** frontend + **Express** backend + **HubSpot CRM** (free plan) for managing bookings as Tickets, with **Stripe** for payments.

## What's included

- **Home page** — browse concerts, search, filter by genre, live seat availability
- **Booking flow** — 2-step form (details → review) with validation
- **HubSpot sync** — every booking creates a Contact + Ticket in HubSpot automatically via API
- **Confirmation page** — booking reference + Stripe payment redirect
- **Dashboard** — organizer view of all bookings pulled live from HubSpot, with status updates (New / Confirmed / Cancelled)
- **Admin panel** — add new concerts on the fly

Works in **mock mode** out of the box (no HubSpot key needed) so you can demo it immediately, and switches to **real HubSpot sync** the moment you add an API key.

---

## 1. Setup

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Open .env and paste your HubSpot Private App token (optional — works without it in mock mode)
npm start
```
Runs on `http://localhost:4000`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173`

Open the frontend URL — you're live.

---

## 2. Get a HubSpot API key (5 min, free)

1. Go to [HubSpot](https://www.hubspot.com) → create a free account
2. Settings → Integrations → **Private Apps** → Create a private app
3. Under **Scopes**, enable:
   - `crm.objects.contacts.read` / `write`
   - `crm.objects.tickets.read` / `write`
   - `tickets`
4. Copy the generated token into `backend/.env` as `HUBSPOT_API_KEY`
5. In HubSpot, go to **Tickets** → make sure the default pipeline has stages: New, Confirmed, Cancelled (or note your stage IDs and edit `server.js` if different)
6. Restart the backend — bookings will now appear as real Tickets in your HubSpot account, viewable on the Dashboard page

---

## 3. Add Stripe payment link (optional, 2 min)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → Payment Links → create one
2. Copy the link
3. Paste it into `STRIPE_PAYMENT_LINK` in:
   - `frontend/src/pages/BookingPage.jsx`
   - `frontend/src/pages/Confirmation.jsx`

---

## 4. Automate confirmation emails with Zapier (optional, free)

1. Zapier → Create Zap → Trigger: **HubSpot — New Ticket**
2. Action: **Gmail/Email — Send Email** using ticket properties (customer email is in the Contact, associated to the Ticket)
3. Free tier covers this easily (under 100 tasks/month)

---

## Project structure
```
concert-app/
├── backend/
│   ├── server.js          # All API routes + HubSpot integration
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── pages/          # Home, BookingPage, Confirmation, Dashboard, Admin
    │   ├── components/      # Navbar
    │   ├── context/         # Toast notifications
    │   └── utils/api.js     # All backend calls
    └── package.json
```

## Tech stack
React 18 · React Router · Vite · Express · Axios · HubSpot CRM API v3

## Notes for your manager demo
- This runs end-to-end **right now** in mock mode — no setup needed to show the flow
- Add the HubSpot key live during the demo to show real CRM sync — it's a nice "wow" moment
- The Dashboard page proves the React ↔ HubSpot integration works both ways (read + write)
