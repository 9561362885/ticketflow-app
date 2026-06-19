import { useState, useEffect } from 'react';
import { getBookings, updateStage } from '../utils/api';
import { useToast } from '../context/ToastContext';
import './Dashboard.css';

const STAGES = {
  '1': { label: 'New',       cls: 'badge-blue'   },
  '2': { label: 'Confirmed', cls: 'badge-green'  },
  '3': { label: 'Cancelled', cls: 'badge-red'    },
};

export default function Dashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const toast = useToast();

  const load = () => {
    setLoading(true);
    getBookings()
      .then(setBookings)
      .catch(() => toast('Could not load bookings from HubSpot', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleStageChange = async (ticketId, stage) => {
    try {
      await updateStage(ticketId, stage);
      toast('Status updated');
      load();
    } catch {
      toast('Update failed', 'error');
    }
  };

  const filtered = filter === 'all'
    ? bookings
    : bookings.filter(b => b.properties?.hs_pipeline_stage === filter);

  const stats = {
    total:     bookings.length,
    new:       bookings.filter(b => b.properties?.hs_pipeline_stage === '1').length,
    confirmed: bookings.filter(b => b.properties?.hs_pipeline_stage === '2').length,
    cancelled: bookings.filter(b => b.properties?.hs_pipeline_stage === '3').length,
  };

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dash-header">
          <div>
            <h1 className="dash-title">Bookings Dashboard</h1>
            <p className="dash-sub">All tickets synced from HubSpot CRM</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={load} disabled={loading}>
            {loading ? <><div className="spinner" /> Refreshing…</> : '↻ Refresh'}
          </button>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <StatCard label="Total"     value={stats.total}     color="var(--accent-light)" />
          <StatCard label="New"       value={stats.new}       color="#60a5fa" />
          <StatCard label="Confirmed" value={stats.confirmed} color="var(--success)" />
          <StatCard label="Cancelled" value={stats.cancelled} color="var(--danger)" />
        </div>

        {/* Filters */}
        <div className="dash-filters">
          {[['all','All'],['1','New'],['2','Confirmed'],['3','Cancelled']].map(([val, label]) => (
            <button
              key={val}
              className={`filter-btn${filter === val ? ' active' : ''}`}
              onClick={() => setFilter(val)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="dash-loading"><div className="spinner" style={{ width: 32, height: 32 }} /></div>
        ) : filtered.length === 0 ? (
          <div className="dash-empty card">
            <p>No bookings found. Once customers book, they'll appear here from HubSpot.</p>
            {!process.env.NODE_ENV && <p style={{ marginTop: 8, fontSize: 13 }}>Make sure your HUBSPOT_API_KEY is set in backend/.env</p>}
          </div>
        ) : (
          <div className="table-wrap card">
            <table className="bookings-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Subject</th>
                  <th>Details</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => {
                  const stage = b.properties?.hs_pipeline_stage || '1';
                  const s = STAGES[stage] || STAGES['1'];
                  const created = new Date(b.properties?.createdate).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  });
                  return (
                    <tr key={b.id}>
                      <td className="ticket-id">#{b.id}</td>
                      <td className="ticket-subject">{b.properties?.subject || '—'}</td>
                      <td className="ticket-content">{b.properties?.content?.slice(0, 60)}…</td>
                      <td className="ticket-date">{created}</td>
                      <td>
                        <span className={`badge ${s.cls}`}>{s.label}</span>
                      </td>
                      <td>
                        <select
                          className="stage-select"
                          value={stage}
                          onChange={e => handleStageChange(b.id, e.target.value)}
                        >
                          <option value="1">New</option>
                          <option value="2">Confirmed</option>
                          <option value="3">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="stat-card card">
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
