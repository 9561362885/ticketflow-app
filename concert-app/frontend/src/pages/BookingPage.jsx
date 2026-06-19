import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getConcert, createBooking } from '../utils/api';
import { useToast } from '../context/ToastContext';
import './BookingPage.css';

// Replace with your actual Stripe payment link
const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/test_8x27sN99vgWubBX3KWeIw00';

export default function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [concert, setConcert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1=details, 2=review

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', seats: 1,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    getConcert(id)
      .then(setConcert)
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrors(er => ({ ...er, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required';
    if (!form.email.trim())     e.email     = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (form.seats < 1)         e.seats     = 'Minimum 1 seat';
    const avail = concert.totalSeats - concert.bookedSeats;
    if (Number(form.seats) > avail) e.seats = `Only ${avail} seats available`;
    return e;
  };

  const handleNext = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setStep(2);
  };

  const handleBook = async () => {
    setSubmitting(true);
    try {
      const result = await createBooking({
        ...form,
        concertId: id,
        seats: Number(form.seats),
      });

      // Navigate to confirmation with booking data
      navigate('/confirmation', { state: { booking: result, concert } });
    } catch (err) {
      const msg = err?.response?.data?.error || 'Booking failed. Please try again.';
      toast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const total = concert ? Number(form.seats) * concert.price : 0;

  if (loading) return (
    <div className="page-loading"><div className="spinner" style={{ width: 36, height: 36 }} /></div>
  );

  if (!concert) return null;

  const available = concert.totalSeats - concert.bookedSeats;

  return (
    <div className="booking-page">
      <div className="container">
        <button className="back-btn" onClick={() => step === 2 ? setStep(1) : navigate('/')}>
          ← {step === 2 ? 'Edit details' : 'Back to events'}
        </button>

        <div className="booking-layout">
          {/* Left — form */}
          <div className="booking-form-wrap">
            <div className="step-indicator">
              <div className={`step-dot${step >= 1 ? ' done' : ''}`}>1</div>
              <div className="step-line" />
              <div className={`step-dot${step >= 2 ? ' done' : ''}`}>2</div>
              <div className="step-line" />
              <div className="step-dot">3</div>
              <div className="step-labels">
                <span>Your details</span><span>Review</span><span>Payment</span>
              </div>
            </div>

            {step === 1 && (
              <div className="card">
                <h2 className="form-heading">Your details</h2>
                <div className="form-row">
                  <div className="form-group">
                    <label>First name *</label>
                    <input name="firstName" value={form.firstName} onChange={onChange} placeholder="Ashish" />
                    {errors.firstName && <span className="field-error">{errors.firstName}</span>}
                  </div>
                  <div className="form-group">
                    <label>Last name</label>
                    <input name="lastName" value={form.lastName} onChange={onChange} placeholder="Sharma" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input name="email" type="email" value={form.email} onChange={onChange} placeholder="you@example.com" />
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input name="phone" type="tel" value={form.phone} onChange={onChange} placeholder="+91 98765 43210" />
                </div>
                <div className="form-group">
                  <label>Number of seats * ({available} available)</label>
                  <select name="seats" value={form.seats} onChange={onChange}>
                    {Array.from({ length: Math.min(10, available) }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n}>{n} seat{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                  {errors.seats && <span className="field-error">{errors.seats}</span>}
                </div>
                <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleNext}>
                  Continue to review →
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="card">
                <h2 className="form-heading">Review your booking</h2>
                <div className="review-rows">
                  <ReviewRow label="Name"    value={`${form.firstName} ${form.lastName}`} />
                  <ReviewRow label="Email"   value={form.email} />
                  <ReviewRow label="Phone"   value={form.phone || '—'} />
                  <ReviewRow label="Concert" value={concert.title} />
                  <ReviewRow label="Venue"   value={concert.venue} />
                  <ReviewRow label="Date"    value={`${formatDate(concert.date)} · ${concert.time}`} />
                  <ReviewRow label="Seats"   value={form.seats} />
                  <ReviewRow label="Price"   value={`₹${concert.price.toLocaleString()} × ${form.seats}`} />
                  <div className="review-total">
                    <span>Total</span>
                    <span className="total-amount">₹{total.toLocaleString()}</span>
                  </div>
                </div>
                <div className="review-notice">
                  🔒 After confirming, you'll be redirected to Stripe to complete payment securely.
                </div>
                <button
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%' }}
                  onClick={handleBook}
                  disabled={submitting}
                >
                  {submitting ? <><div className="spinner" /> Confirming…</> : 'Confirm & Pay →'}
                </button>
              </div>
            )}
          </div>

          {/* Right — concert summary */}
          <div className="concert-summary card">
            <img src={concert.image} alt={concert.title} className="summary-img" />
            <div className="summary-body">
              <span className="badge badge-purple">{concert.genre}</span>
              <h3 className="summary-title">{concert.title}</h3>
              <p className="summary-meta">📍 {concert.venue}</p>
              <p className="summary-meta">🗓 {formatDate(concert.date)}</p>
              <p className="summary-meta">🕐 {concert.time}</p>
              <div className="summary-divider" />
              <div className="summary-price-row">
                <span>Price per seat</span>
                <span className="summary-price">₹{concert.price.toLocaleString()}</span>
              </div>
              {form.seats > 0 && (
                <div className="summary-price-row summary-total-row">
                  <span>Total ({form.seats} seat{form.seats > 1 ? 's' : ''})</span>
                  <span className="summary-price grad-text">₹{total.toLocaleString()}</span>
                </div>
              )}
              <div className="seats-left-info">
                🎟 {available} seats remaining
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="review-row">
      <span className="review-label">{label}</span>
      <span className="review-value">{value}</span>
    </div>
  );
}
