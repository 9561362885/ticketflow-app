import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import './Confirmation.css';

// Replace with your actual Stripe payment link
const STRIPE_LINK = 'https://buy.stripe.com/test_8x27sN99vgWubBX3KWeIw00';

export default function Confirmation() {
  const { state } = useLocation();
  const navigate  = useNavigate();

  useEffect(() => {
    if (!state?.booking) navigate('/');
  }, [state]);

  if (!state?.booking) return null;

  const { booking, concert } = state;

  const handlePay = () => {
    // Open Stripe with prefilled email if possible
    window.open(`${STRIPE_LINK}?prefilled_email=${encodeURIComponent(booking.email)}`, '_blank');
  };

  return (
    <div className="confirm-page">
      <div className="container confirm-container">
        <div className="confirm-card card">
          <div className="confirm-icon">🎉</div>
          <h1 className="confirm-heading">Booking confirmed!</h1>
          <p className="confirm-sub">
            Your booking has been saved in our system. Complete the payment below to lock your seats.
          </p>

          {booking.note && (
            <div className="mock-notice">⚠️ {booking.note}</div>
          )}

          <div className="confirm-ref">
            Booking ref: <strong>{booking.bookingRef}</strong>
          </div>

          <div className="confirm-details">
            <DetailRow label="Concert" value={booking.concert} />
            <DetailRow label="Seats"   value={`${booking.seats} seat${booking.seats > 1 ? 's' : ''}`} />
            <DetailRow label="Email"   value={booking.email} />
            <DetailRow
              label="Total"
              value={`₹${booking.totalAmount?.toLocaleString()}`}
              highlight
            />
          </div>

          <button className="btn btn-primary btn-lg pay-btn" onClick={handlePay}>
            💳 Pay ₹{booking.totalAmount?.toLocaleString()} via Stripe
          </button>

          <p className="pay-note">
            You'll be taken to Stripe's secure payment page. A confirmation email will be sent after payment.
          </p>

          <div className="confirm-actions">
            <Link to="/" className="btn btn-outline">← Back to events</Link>
            <Link to="/dashboard" className="btn btn-outline">View all bookings</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, highlight }) {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className={`detail-value${highlight ? ' highlight' : ''}`}>{value}</span>
    </div>
  );
}
