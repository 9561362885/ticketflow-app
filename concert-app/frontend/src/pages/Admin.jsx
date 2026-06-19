import { useState, useEffect } from 'react';
import { getConcerts, addConcert, updateConcert, deleteConcert } from '../utils/api';
import { useToast } from '../context/ToastContext';
import './Admin.css';

const EMPTY = { title: '', venue: '', date: '', time: '7:00 PM', price: '', totalSeats: '', genre: 'Music', image: '' };
const GENRES = ['Rock', 'Bollywood', 'EDM', 'Jazz', 'Classical', 'Hip-Hop', 'Pop', 'Music'];

export default function Admin() {
  const [concerts, setConcerts] = useState([]);
  const [form, setForm]         = useState(EMPTY);
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = adding new, otherwise editing this id
  const [deletingId, setDeletingId] = useState(null); // for delete confirm popup
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

  const resetForm = () => {
    setForm(EMPTY);
    setErrors({});
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      if (editingId) {
        await updateConcert(editingId, form);
        toast('Concert updated successfully!');
      } else {
        await addConcert(form);
        toast('Concert added successfully!');
      }
      resetForm();
      load();
    } catch {
      toast(editingId ? 'Failed to update concert' : 'Failed to add concert', 'error');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (concert) => {
    setForm({
      title: concert.title,
      venue: concert.venue,
      date: concert.date,
      time: concert.time,
      price: concert.price,
      totalSeats: concert.totalSeats,
      genre: concert.genre,
      image: concert.image || '',
    });
    setEditingId(concert.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startAdd = () => {
    if (showForm && !editingId) {
      resetForm();
    } else {
      setForm(EMPTY);
      setEditingId(null);
      setShowForm(true);
    }
  };

  const confirmDelete = async (id) => {
    setLoading(true);
    try {
      await deleteConcert(id);
      toast('Concert deleted');
      setDeletingId(null);
      load();
    } catch {
      toast('Failed to delete concert', 'error');
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
          <button className="btn btn-primary" onClick={startAdd}>
            {showForm && !editingId ? '✕ Cancel' : '+ Add concert'}
          </button>
        </div>

        {/* Add / Edit form */}
        {showForm && (
          <div className="card admin-form-card">
            <h2 className="form-section-title">{editingId ? 'Edit Concert' : 'New Concert'}</h2>

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

            <div className="form-group">
              <label>Image URL (optional)</label>
              <input name="image" value={form.image} onChange={onChange} placeholder="https://images.unsplash.com/..." />
              <span className="image-hint">Tip: search "concert" on unsplash.com → right-click an image → Copy image address</span>
            </div>

            {form.image && (
              <div className="image-preview-wrap">
                <img src={form.image} alt="preview" className="image-preview" onError={(e) => e.target.style.display = 'none'} />
              </div>
            )}

            <div className="form-actions">
              <button className="btn btn-outline" onClick={resetForm}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading
                  ? <><div className="spinner" /> Saving…</>
                  : editingId ? '✓ Save changes' : '✓ Add concert'}
              </button>
            </div>
          </div>
        )}

        {/* Concert list */}
        <div className="admin-concerts-grid">
          {concerts.map(c => (
            <div key={c.id} className="admin-concert-card card">
              {c.image && (
                <div className="admin-card-img-wrap">
                  <img src={c.image} alt={c.title} className="admin-card-img" />
                </div>
              )}
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

              {/* Edit / Delete actions */}
              <div className="admin-card-actions">
                <button className="btn btn-outline btn-sm" onClick={() => startEdit(c)}>
                  ✎ Edit
                </button>
                {deletingId === c.id ? (
                  <div className="delete-confirm">
                    <span>Delete this?</span>
                    <button className="btn btn-danger btn-sm" onClick={() => confirmDelete(c.id)} disabled={loading}>
                      {loading ? <div className="spinner" /> : 'Yes'}
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => setDeletingId(null)}>No</button>
                  </div>
                ) : (
                  <button className="btn btn-outline btn-sm btn-delete" onClick={() => setDeletingId(c.id)}>
                    🗑 Delete
                  </button>
                )}
              </div>
            </div>
          ))}

          {concerts.length === 0 && (
            <div className="admin-empty card">
              <p>No concerts yet. Click "+ Add concert" to create your first one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
