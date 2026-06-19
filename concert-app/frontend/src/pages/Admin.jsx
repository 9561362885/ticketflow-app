import { useState, useEffect } from 'react';
import { getConcerts, addConcert } from '../utils/api';
import { useToast } from '../context/ToastContext';
import './Admin.css';

const EMPTY = { title: '', venue: '', date: '', time: '7:00 PM', price: '', totalSeats: '', genre: 'Music' };
const GENRES = ['Rock', 'Bollywood', 'EDM', 'Jazz', 'Classical', 'Hip-Hop', 'Pop', 'Music'];

export default function Admin() {
  const [concerts, setConcerts] = useState([]);
  const [form, setForm]         = useState(EMPTY);
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [showForm, setShowForm] = useState(false);
  const toast = useToast();

  const load = () => getConcerts().then(setConcerts);
  useEffect(() => { load(); }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrors(er => ({ ...er, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim())     e.title     = 'Required';
    if (!form.venue.trim())     e.venue     = 'Required';
    if (!form.date)             e.date      = 'Required';
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0)      e.price = 'Enter a valid price';
    if (!form.totalSeats || isNaN(form.totalSeats) || Number(form.totalSeats) <= 0) e.totalSeats = 'Enter valid seat count';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      await addConcert(form);
      toast('Concert added successfully!');
      setForm(EMPTY);
      setShowForm(false);
      load();
    } catch {
      toast('Failed to add concert', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-header">
          <div>
            <h1 className="admin-title">Admin Panel</h1>
            <p className="admin-sub">Manage concerts and events</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
            {showForm ? '✕ Cancel' : '+ Add concert'}
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="card admin-form-card">
            <h2 className="form-section-title">New Concert</h2>
            <div className="form-group">
              <label>Concert / Artist name *</label>
              <input name="title" value={form.title} onChange={onChange} placeholder="Arctic Monkeys Live" />
              {errors.title && <span className="field-error">{errors.title}</span>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Venue *</label>
                <input name="venue" value={form.venue} onChange={onChange} placeholder="MMRDA Grounds, Mumbai" />
                {errors.venue && <span className="field-error">{errors.venue}</span>}
              </div>
              <div className="form-group">
                <label>Genre</label>
                <select name="genre" value={form.genre} onChange={onChange}>
                  {GENRES.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Date *</label>
                <input name="date" type="date" value={form.date} onChange={onChange} />
                {errors.date && <span className="field-error">{errors.date}</span>}
              </div>
              <div className="form-group">
                <label>Time</label>
                <input name="time" value={form.time} onChange={onChange} placeholder="7:00 PM" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Price per seat (₹) *</label>
                <input name="price" type="number" value={form.price} onChange={onChange} placeholder="1500" min="0" />
                {errors.price && <span className="field-error">{errors.price}</span>}
              </div>
              <div className="form-group">
                <label>Total seats *</label>
                <input name="totalSeats" type="number" value={form.totalSeats} onChange={onChange} placeholder="200" min="1" />
                {errors.totalSeats && <span className="field-error">{errors.totalSeats}</span>}
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? <><div className="spinner" /> Saving…</> : '✓ Add concert'}
              </button>
            </div>
          </div>
        )}

        {/* Concert list */}
        <div className="admin-concerts-grid">
          {concerts.map(c => (
            <div key={c.id} className="admin-concert-card card">
              <div className="admin-card-top">
                <div>
                  <span className="badge badge-purple">{c.genre}</span>
                  <h3 className="admin-concert-title">{c.title}</h3>
                </div>
                <div className="admin-price">₹{c.price.toLocaleString()}</div>
              </div>
              <p className="admin-meta">📍 {c.venue}</p>
              <p className="admin-meta">🗓 {formatDate(c.date)} · {c.time}</p>
              <div className="admin-seats-row">
                <div className="seat-bar" style={{ flex: 1 }}>
                  <div
                    className="seat-bar-fill"
                    style={{
                      width: `${Math.round((c.bookedSeats / c.totalSeats) * 100)}%`,
                      background: c.bookedSeats / c.totalSeats > 0.8 ? 'var(--danger)' : 'var(--accent)',
                      height: '4px', borderRadius: '2px',
                    }}
                  />
                </div>
                <span style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                  {c.bookedSeats}/{c.totalSeats} seats
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
