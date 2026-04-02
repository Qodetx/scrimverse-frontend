import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  ChevronDown,
  Loader2,
  Wallet,
  Calendar,
} from 'lucide-react';
import { paymentsAPI } from '../../../utils/api';
import './PlayerTransactionHistoryView.css';

const GAME_OPTIONS = ['All Games', 'BGMI', 'Free Fire', 'COD Mobile', 'Valorant', 'Scarfall'];
const TIME_OPTIONS = ['All Time', 'This Week', 'This Month', 'Last 3 Months', 'This Year'];

const GAME_FILTER_MAP = {
  'Free Fire': 'freefire',
  'COD Mobile': 'cod',
};

function getTimeStart(period) {
  const now = new Date();
  if (period === 'This Week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (period === 'This Month') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  if (period === 'Last 3 Months') {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 3);
    return d;
  }
  if (period === 'This Year') {
    return new Date(now.getFullYear(), 0, 1);
  }
  return null;
}

export default function PlayerTransactionHistoryView() {
  const [payments, setPayments] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gameFilter, setGameFilter] = useState('All Games');
  const [timeFilter, setTimeFilter] = useState('All Time');
  const [showGameFilter, setShowGameFilter] = useState(false);
  const [showTimeFilter, setShowTimeFilter] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      try {
        const [payRes, earnRes] = await Promise.all([
          paymentsAPI.listPayments(),
          paymentsAPI.getEarnings(),
        ]);
        if (cancelled) return;
        setPayments(payRes.data?.results ?? payRes.data ?? []);
        setEarnings(earnRes.data?.earnings ?? []);
      } catch (err) {
        console.error('Failed to load transactions', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  // Merge payments (spent) + earnings into a single sorted list
  const transactions = useMemo(() => {
    const spent = payments
      .filter((p) => p.status === 'completed')
      .map((p) => ({
        id: `pay-${p.id}`,
        type: 'spent',
        name: p.tournament_title || 'Entry Fee',
        game: p.tournament_game_name || 'Unknown',
        amount: Number(p.amount) || 0,
        date: p.created_at,
        category: p.payment_type === 'entry_fee' ? 'Entry Fee' : 'Plan',
      }));

    const earned = earnings.map((e, i) => ({
      id: `earn-${e.tournament_id || i}`,
      type: 'earned',
      name: e.tournament_title || 'Prize Money',
      game: e.game_name || 'Unknown',
      amount: Number(e.amount) || 0,
      date: e.date,
      category: `#${e.position} Prize`,
    }));

    const all = [...spent, ...earned];
    all.sort((a, b) => new Date(b.date) - new Date(a.date));
    return all;
  }, [payments, earnings]);

  const filtered = useMemo(() => {
    let result = transactions;

    // Time filter
    const timeStart = getTimeStart(timeFilter);
    if (timeStart) {
      result = result.filter((t) => t.date && new Date(t.date) >= timeStart);
    }

    // Game filter
    if (gameFilter !== 'All Games') {
      const displayLower = gameFilter.toLowerCase();
      const backendLower = GAME_FILTER_MAP[gameFilter] || displayLower;
      result = result.filter((t) => {
        const tGame = t.game?.toLowerCase() || '';
        return tGame === displayLower || tGame === backendLower;
      });
    }

    return result;
  }, [transactions, gameFilter, timeFilter]);

  // Count per game for filter dropdown
  const gameCounts = useMemo(() => {
    const counts = {};
    for (const t of transactions) {
      const g = t.game || 'Unknown';
      counts[g] = (counts[g] || 0) + 1;
    }
    return counts;
  }, [transactions]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="th-loading">
        <Loader2 size={28} className="th-spinner" />
      </div>
    );
  }

  return (
    <div className="th-container">
      {/* Title */}
      <h2 className="th-title">
        <Receipt size={20} className="th-title-icon" />
        Transaction History
      </h2>

      {/* Filter Row */}
      <div className="th-filter-row">
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Time filter */}
          <div style={{ position: 'relative' }}>
            <button
              className="th-filter-btn"
              onClick={() => {
                setShowTimeFilter(!showTimeFilter);
                setShowGameFilter(false);
              }}
            >
              <Calendar size={14} />
              {timeFilter}
              <ChevronDown size={14} />
            </button>
            {showTimeFilter && (
              <div className="th-filter-dropdown">
                {TIME_OPTIONS.map((t) => (
                  <button
                    key={t}
                    className={`th-filter-item${timeFilter === t ? ' selected' : ''}`}
                    onClick={() => {
                      setTimeFilter(t);
                      setShowTimeFilter(false);
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Game filter */}
          <div style={{ position: 'relative' }}>
            <button
              className="th-filter-btn"
              onClick={() => {
                setShowGameFilter(!showGameFilter);
                setShowTimeFilter(false);
              }}
            >
              <Filter size={14} />
              {gameFilter}
              <ChevronDown size={14} />
            </button>
            {showGameFilter && (
              <div className="th-filter-dropdown">
                {GAME_OPTIONS.map((g) => (
                  <button
                    key={g}
                    className={`th-filter-item${gameFilter === g ? ' selected' : ''}`}
                    onClick={() => {
                      setGameFilter(g);
                      setShowGameFilter(false);
                    }}
                  >
                    {g}
                    {g !== 'All Games' && gameCounts[g] ? (
                      <span className="th-filter-count">({gameCounts[g]})</span>
                    ) : null}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <span className="th-filter-count">{filtered.length} transactions</span>
      </div>

      {/* Transaction List */}
      {filtered.length === 0 ? (
        <div className="th-empty">
          <Wallet size={40} className="th-empty-icon" />
          <p className="th-empty-title">No transactions yet</p>
          <p className="th-empty-sub">
            Join tournaments and compete to see your transaction history here
          </p>
        </div>
      ) : (
        <div className="th-list">
          {filtered.map((tx) => {
            const isEarned = tx.type === 'earned';
            return (
              <div key={tx.id} className="th-list-divider">
                <div className="th-row">
                  <div
                    className={`th-row-icon ${isEarned ? 'th-row-icon-green' : 'th-row-icon-red'}`}
                  >
                    {isEarned ? (
                      <ArrowUpRight size={18} color="rgb(34,197,94)" />
                    ) : (
                      <ArrowDownRight size={18} color="rgb(239,68,68)" />
                    )}
                  </div>

                  <div className="th-row-details">
                    <div className="th-row-name">{tx.name}</div>
                    <div className="th-row-meta">
                      <span className="th-badge">{tx.game}</span>
                      <span className="th-row-date">{formatDate(tx.date)}</span>
                    </div>
                  </div>

                  <div
                    className={`th-row-amount ${isEarned ? 'th-amount-green' : 'th-amount-red'}`}
                  >
                    {isEarned ? '+' : '-'}₹{tx.amount}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
