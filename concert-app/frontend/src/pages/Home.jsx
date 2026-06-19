import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getConcerts } from '../utils/api';
import './Home.css';

const GENRES = ['All', 'Rock', 'Bollywood', 'EDM', 'Jazz'];

export default function Home() {
  const [concerts, setConcerts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [genre, setGenre]       = useState('All');
  const [search, setSearch]     = useState('');

  useEffect(() => {
    getConcerts()
      .then(setConcerts)
      .finally(() => setLoading(false));
  }, []);

  const filtered = concerts.filter(c => {
    const matchGenre  = genre === 'All' || c.genre === genre;
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
                        c.venue.toLowerCase().includes(search.toLowerCase());
    return matchGenre && matchSearch;
  });

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const available = (c) => c.totalSeats - c.bookedSeats;
  const pct       = (c) => Math.round((c.bookedSeats / c.totalSeats) * 100);

  return (
    <div className="home-page">
      {/* Hero */}
      <div className="hero">
        <div className="container">
          <h1 className="hero-title">Find your next<br /><span className="grad">live experience.</span></h1>
          <p className="hero-sub">Discover and book tickets to the best concerts near you.</p>
          <input
            className="hero-search"
            placeholder="Search by artist or venue…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="container">
        {/* Genre filter */}
        <div className="genre-filters">
          {GENRES.map(g => (
            <button
              key={g}
              className={`genre-btn${genre === g ? ' active' : ''}`}
              onClick={() => setGenre(g)}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p>No concerts found. Try a different search.</p>
          </div>
        ) : (
          <div className="concert-grid">
            {filtered.map(c => (
              <Link to={`/concert/${c.id}`} key={c.id} className="concert-card">
                <div className="card-image">
                  <img src={c.image} alt={c.title} loading="lazy" />
                  <span className="card-genre">{c.genre}</span>
                </div>
                <div className="card-body">
                  <h2 className="card-title">{c.title}</h2>
                  <p className="card-venue">📍 {c.venue}</p>
                  <p className="card-date">🗓 {formatDate(c.date)} · {c.time}</p>

                  <div className="seat-bar-wrap">
                    <div className="seat-bar">
                      <div
                        className="seat-bar-fill"
                        style={{ width: `${pct(c)}%`, background: pct(c) > 80 ? 'var(--danger)' : 'var(--accent)' }}
                      />
                    </div>
                    <span className="seat-label">{available(c)} seats left</span>
                  </div>

                  <div className="card-footer">
                    <span className="card-price">₹{c.price.toLocaleString()}</span>
                    <span className="btn btn-primary btn-sm">Book now</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
