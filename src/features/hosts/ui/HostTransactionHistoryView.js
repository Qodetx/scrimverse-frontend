import { useState, useEffect, useRef, useMemo } from 'react';
import {
  DollarSign,
  Trophy,
  Users,
  ChevronDown,
  Check,
  Loader2,
  TrendingUp,
  Download,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { paymentsAPI } from '../../../utils/api';
import { useToast } from '../../../hooks/useToast';
import './HostTransactionHistoryView.css';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatAmount = (n) => {
  const num = Number(n) || 0;
  return `₹${num.toLocaleString('en-IN')}`;
};

const DATE_PRESETS = [
  { label: 'All', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'This month', value: 'month' },
];

const STATUS_OPTIONS = ['All', 'Paid'];

const isInDateRange = (dateStr, preset) => {
  if (preset === 'all') return true;
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  if (preset === 'today') {
    return d.toDateString() === now.toDateString();
  }
  if (preset === '7d') {
    const cutoff = new Date(now - 7 * 24 * 60 * 60 * 1000);
    return d >= cutoff;
  }
  if (preset === 'month') {
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }
  return true;
};

const HostTransactionHistoryView = () => {
  const { showToast } = useToast();
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [tSearch, setTSearch] = useState('');
  const [datePreset, setDatePreset] = useState('all');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setTSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    paymentsAPI
      .getHostTransactions()
      .then((res) => {
        setTournaments(res.data?.tournaments || []);
      })
      .catch(() => showToast('Failed to load transactions', 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Flatten all payments across tournaments for "All Tournaments" view
  const allPayments = useMemo(() => {
    return tournaments.flatMap((t) =>
      (t.payments || []).map((p) => ({ ...p, tournament_title: t.title, tournament_id: t.id }))
    );
  }, [tournaments]);

  // Payments for the selected tournament (or all)
  const basePayments = useMemo(() => {
    if (selectedTournamentId === 'all') return allPayments;
    const t = tournaments.find((t) => t.id === selectedTournamentId);
    return (t?.payments || []).map((p) => ({
      ...p,
      tournament_title: t.title,
      tournament_id: t.id,
    }));
  }, [selectedTournamentId, tournaments, allPayments]);

  // Apply date + status filters
  const filteredPayments = useMemo(() => {
    setPage(1); // reset to first page whenever filters change
    return basePayments.filter((p) => {
      if (!isInDateRange(p.paid_at, datePreset)) return false;
      if (statusFilter !== 'All') {
        if (statusFilter === 'Paid' && p.status && p.status !== 'completed') return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basePayments, datePreset, statusFilter]);

  const totalPages = Math.ceil(filteredPayments.length / PAGE_SIZE);
  const pagedPayments = filteredPayments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Summary for current view
  const summaryRevenue = useMemo(
    () => filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
    [filteredPayments]
  );

  const selectedTournament =
    selectedTournamentId !== 'all' ? tournaments.find((t) => t.id === selectedTournamentId) : null;

  const tournamentLabel =
    selectedTournamentId === 'all'
      ? 'All Tournaments'
      : selectedTournament?.title || 'Select Tournament';

  const exportCSV = () => {
    if (filteredPayments.length === 0) return;
    const escapeCSV = (val) => {
      const s = String(val ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };
    const rows = [];
    rows.push([
      `Transaction History — ${tournamentLabel} (${DATE_PRESETS.find((d) => d.value === datePreset)?.label || 'All'})`,
    ]);
    rows.push(['Date', 'Team', 'Tournament', 'Amount (₹)', 'Status']);
    filteredPayments.forEach((p) =>
      rows.push([
        p.paid_at ? new Date(p.paid_at).toLocaleDateString('en-IN') : '',
        p.team_name || '',
        p.tournament_title || '',
        Number(p.amount) || 0,
        'Paid',
      ])
    );
    rows.push([]);
    rows.push(['Total Revenue', formatAmount(summaryRevenue)]);

    const csv = rows.map((r) => r.map(escapeCSV).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scrimverse-transactions-${tournamentLabel
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9_-]/gi, '')
      .toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="htx-loading">
        <Loader2 size={28} className="htx-spinner" />
      </div>
    );
  }

  return (
    <div className="htx-container">
      {/* Header */}
      <div className="htx-header">
        <h2 className="htx-title">
          <DollarSign size={20} className="htx-title-icon" />
          Transaction History
        </h2>

        <div className="htx-header-actions">
          {/* Tournament dropdown */}
          <div className="htx-dropdown-wrap" ref={dropdownRef}>
            <button className="htx-tournament-btn" onClick={() => setDropdownOpen((v) => !v)}>
              <Trophy size={14} />
              <span className="htx-tournament-btn-label">{tournamentLabel}</span>
              <ChevronDown
                size={12}
                style={{
                  transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s',
                  flexShrink: 0,
                }}
              />
            </button>

            {dropdownOpen && (
              <div className="htx-dropdown-menu">
                {/* Search */}
                <div className="htx-dropdown-search">
                  <Search size={11} style={{ opacity: 0.5, flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="Search tournaments..."
                    value={tSearch}
                    onChange={(e) => setTSearch(e.target.value)}
                    className="htx-dropdown-search-input"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                {/* Scrollable list */}
                <div className="htx-dropdown-list">
                  {[{ id: 'all', title: 'All Tournaments' }, ...tournaments]
                    .filter(
                      (t) =>
                        !tSearch.trim() ||
                        t.title.toLowerCase().includes(tSearch.trim().toLowerCase())
                    )
                    .map((t) => (
                      <button
                        key={t.id}
                        className={`htx-dropdown-item${selectedTournamentId === t.id ? ' selected' : ''}`}
                        onClick={() => {
                          setSelectedTournamentId(t.id);
                          setDropdownOpen(false);
                          setTSearch('');
                        }}
                      >
                        {selectedTournamentId === t.id && (
                          <Check size={12} style={{ flexShrink: 0 }} />
                        )}
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                          {t.title}
                          {t.game_name ? ` · ${t.game_name}` : ''}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Export CSV */}
          {filteredPayments.length > 0 && (
            <button className="htx-export-btn" onClick={exportCSV}>
              <Download size={13} />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Filters row */}
      <div className="htx-filters-row">
        {/* Date range presets */}
        <div className="htx-filter-group">
          <Calendar size={13} className="htx-filter-icon" />
          {DATE_PRESETS.map((p) => (
            <button
              key={p.value}
              className={`htx-filter-pill${datePreset === p.value ? ' active' : ''}`}
              onClick={() => setDatePreset(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="htx-filter-group">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              className={`htx-filter-pill${statusFilter === s ? ' active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards — show totals for current filter */}
      <div className="htx-stats-grid">
        <div className="htx-stat-card">
          <TrendingUp size={18} className="htx-stat-icon htx-stat-icon-purple" />
          <div className="htx-stat-value htx-stat-value-purple">{formatAmount(summaryRevenue)}</div>
          <div className="htx-stat-label">
            {selectedTournamentId === 'all'
              ? 'Total Revenue'
              : `Revenue — ${selectedTournament?.title}`}
          </div>
        </div>
        <div className="htx-stat-card">
          <DollarSign size={18} className="htx-stat-icon htx-stat-icon-muted" />
          <div className="htx-stat-value htx-stat-value-muted">
            {formatAmount(summaryRevenue * 0.1)}
          </div>
          <div className="htx-stat-label">ScrimVerse Fee (10%)</div>
        </div>
        <div className="htx-stat-card">
          <Users size={18} className="htx-stat-icon htx-stat-icon-muted" />
          <div className="htx-stat-value">{filteredPayments.length}</div>
          <div className="htx-stat-label">
            {filteredPayments.length === basePayments.length
              ? 'Transactions'
              : `Transactions (filtered from ${basePayments.length})`}
          </div>
        </div>
      </div>

      {/* Payment table */}
      {filteredPayments.length === 0 ? (
        <div className="htx-no-payments">
          {tournaments.length === 0
            ? 'No tournaments created yet. Transactions will appear here once teams pay entry fees.'
            : basePayments.length === 0
              ? 'No entry fee payments yet for this tournament'
              : 'No transactions match the current filters'}
        </div>
      ) : (
        <div className="htx-table-wrap">
          <table className="htx-table">
            <thead>
              <tr className="htx-table-head">
                <th className="htx-th htx-th-left">Date</th>
                <th className="htx-th htx-th-left">Team</th>
                {selectedTournamentId === 'all' && (
                  <th className="htx-th htx-th-left">Tournament</th>
                )}
                <th className="htx-th htx-th-right">Amount</th>
                <th className="htx-th htx-th-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {pagedPayments.map((p, i) => (
                <tr key={i} className="htx-tr">
                  <td className="htx-td htx-td-date">{formatDate(p.paid_at)}</td>
                  <td className="htx-td htx-td-name">{p.team_name}</td>
                  {selectedTournamentId === 'all' && (
                    <td className="htx-td htx-td-tournament">{p.tournament_title}</td>
                  )}
                  <td className="htx-td htx-td-amount">{formatAmount(p.amount)}</td>
                  <td className="htx-td htx-td-status">
                    <span className="htx-status-badge">Paid</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="htx-pagination">
              <span className="htx-page-info">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredPayments.length)}{' '}
                of {filteredPayments.length}
              </span>
              <div className="htx-page-btns">
                <button
                  className="htx-page-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === '…' ? (
                      <span key={`ellipsis-${idx}`} className="htx-page-ellipsis">
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        className={`htx-page-btn${page === item ? ' active' : ''}`}
                        onClick={() => setPage(item)}
                      >
                        {item}
                      </button>
                    )
                  )}
                <button
                  className="htx-page-btn"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HostTransactionHistoryView;
