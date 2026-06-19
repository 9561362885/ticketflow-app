require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

const hs = axios.create({
  baseURL: 'https://api.hubapi.com',
  headers: {
    Authorization: `Bearer ${process.env.HUBSPOT_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

// ─── Health check ───────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ─── GET all concerts (stored as HubSpot Tickets with stage "concert") ───────
// For simplicity we use a local JSON store for concerts and HubSpot for bookings
const concerts = [
  {
    id: 'c1',
    title: 'Arctic Monkeys Live',
    venue: 'MMRDA Grounds, Mumbai',
    date: '2026-08-15',
    time: '7:00 PM',
    price: 1500,
    totalSeats: 200,
    bookedSeats: 42,
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80',
    genre: 'Rock',
  },
  {
    id: 'c2',
    title: 'Arijit Singh Night',
    venue: 'Nagpur Futala Lake Ground',
    date: '2026-09-02',
    time: '8:00 PM',
    price: 999,
    totalSeats: 500,
    bookedSeats: 120,
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80',
    genre: 'Bollywood',
  },
  {
    id: 'c3',
    title: 'EDM Night — Sunburn',
    venue: 'Shivaji Stadium, Pune',
    date: '2026-09-20',
    time: '9:00 PM',
    price: 2000,
    totalSeats: 300,
    bookedSeats: 88,
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80',
    genre: 'EDM',
  },
  {
    id: 'c4',
    title: 'Jazz Under The Stars',
    venue: 'Nehru Centre, Mumbai',
    date: '2026-10-05',
    time: '6:30 PM',
    price: 750,
    totalSeats: 150,
    bookedSeats: 30,
    image: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=600&q=80',
    genre: 'Jazz',
  },
];

app.get('/api/concerts', (req, res) => res.json(concerts));

app.get('/api/concerts/:id', (req, res) => {
  const concert = concerts.find((c) => c.id === req.params.id);
  if (!concert) return res.status(404).json({ error: 'Concert not found' });
  res.json(concert);
});

app.post('/api/concerts', (req, res) => {
  const { title, venue, date, time, price, totalSeats, genre, image } = req.body;
  if (!title || !venue || !date || !price || !totalSeats)
    return res.status(400).json({ error: 'Missing required fields' });
  const concert = {
    id: uuidv4(),
    title,
    venue,
    date,
    time: time || '7:00 PM',
    price: Number(price),
    totalSeats: Number(totalSeats),
    bookedSeats: 0,
    genre: genre || 'Music',
    image: image || 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80',
  };
  concerts.push(concert);
  res.status(201).json(concert);
});

app.put('/api/concerts/:id', (req, res) => {
  const concert = concerts.find((c) => c.id === req.params.id);
  if (!concert) return res.status(404).json({ error: 'Concert not found' });
  const { title, venue, date, time, price, totalSeats, genre, image } = req.body;
  Object.assign(concert, {
    title: title ?? concert.title,
    venue: venue ?? concert.venue,
    date: date ?? concert.date,
    time: time ?? concert.time,
    price: price ? Number(price) : concert.price,
    totalSeats: totalSeats ? Number(totalSeats) : concert.totalSeats,
    genre: genre ?? concert.genre,
    image: image || concert.image,
  });
  res.json(concert);
});

app.delete('/api/concerts/:id', (req, res) => {
  const idx = concerts.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Concert not found' });
  concerts.splice(idx, 1);
  res.json({ success: true });
});

// ─── Book a ticket — creates Contact + Ticket in HubSpot ─────────────────────
app.post('/api/bookings', async (req, res) => {
  const { firstName, lastName, email, phone, concertId, seats } = req.body;

  if (!firstName || !email || !concertId || !seats)
    return res.status(400).json({ error: 'Missing required fields' });

  const concert = concerts.find((c) => c.id === concertId);
  if (!concert) return res.status(404).json({ error: 'Concert not found' });

  if (concert.bookedSeats + Number(seats) > concert.totalSeats)
    return res.status(400).json({ error: 'Not enough seats available' });

  try {
    // 1. Create or update Contact
    const contactRes = await hs.post('/crm/v3/objects/contacts', {
      properties: {
        firstname: firstName,
        lastname: lastName || '',
        email,
        phone: phone || '',
      },
    });
    const contactId = contactRes.data.id;

    // 2. Create Ticket
    const totalAmount = Number(seats) * concert.price;
    const ticketRes = await hs.post('/crm/v3/objects/tickets', {
      properties: {
        subject: `${concert.title} — ${seats} seat(s)`,
        content: `Booking for ${firstName} ${lastName || ''} | ${seats} seat(s) | ₹${totalAmount} | ${concert.date} at ${concert.time} | ${concert.venue}`,
        hs_ticket_priority: 'MEDIUM',
        hs_pipeline: '0',
        hs_pipeline_stage: '1',
      },
    });
    const ticketId = ticketRes.data.id;

    // 3. Associate Contact ↔ Ticket
    await hs.put(
      `/crm/v3/objects/tickets/${ticketId}/associations/contacts/${contactId}/ticket_to_contact`,
      {}
    );

    // 4. Update local seat count
    concert.bookedSeats += Number(seats);

    const bookingRef = `TKT-${ticketId}`;

    res.status(201).json({
      success: true,
      bookingRef,
      ticketId,
      contactId,
      concert: concert.title,
      seats: Number(seats),
      totalAmount,
      email,
    });
  } catch (err) {
    console.error('HubSpot error:', err?.response?.data || err.message);

    // If HubSpot key not set, return mock success for testing
    if (!process.env.HUBSPOT_API_KEY || process.env.HUBSPOT_API_KEY === 'your_hubspot_private_app_token_here') {
      concert.bookedSeats += Number(seats);
      const mockRef = `TKT-MOCK-${Date.now()}`;
      return res.status(201).json({
        success: true,
        bookingRef: mockRef,
        ticketId: 'mock',
        contactId: 'mock',
        concert: concert.title,
        seats: Number(seats),
        totalAmount: Number(seats) * concert.price,
        email,
        note: 'Mock booking — add HUBSPOT_API_KEY to .env for real CRM sync',
      });
    }

    res.status(500).json({ error: 'Booking failed', details: err?.response?.data });
  }
});

// ─── Get all bookings (tickets) from HubSpot ─────────────────────────────────
app.get('/api/bookings', async (req, res) => {
  try {
    const r = await hs.get('/crm/v3/objects/tickets?limit=50&properties=subject,content,hs_pipeline_stage,createdate');
    res.json(r.data.results || []);
  } catch (err) {
    console.error('HubSpot fetch error:', err?.response?.data || err.message);
    // Return empty array if HubSpot not configured
    res.json([]);
  }
});

// ─── Update ticket stage ──────────────────────────────────────────────────────
app.patch('/api/bookings/:ticketId/stage', async (req, res) => {
  const { stage } = req.body; // '1' = New, '2' = Confirmed, '3' = Cancelled
  try {
    const r = await hs.patch(`/crm/v3/objects/tickets/${req.params.ticketId}`, {
      properties: { hs_pipeline_stage: stage },
    });
    res.json(r.data);
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

app.listen(PORT, () => console.log(`✅  Backend running on http://localhost:${PORT}`));