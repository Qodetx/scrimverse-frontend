import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Users,
  Trophy,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  IndianRupee,
  UserPlus,
  UserCheck,
  Percent,
  ChevronDown,
  Gamepad2,
  Shield,
  Zap,
  Target,
  Eye,
  Search,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { tournamentAPI } from '../../../utils/api';
import './HostAnalyticsView.css';

// Generate dynamic empty placeholder data using actual current dates
const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

// Format "YYYY-MM-DD" → "24 Mar '26"
const formatDateTick = (dateStr) => {
  if (!dateStr || !dateStr.includes('-')) return dateStr;
  const [yr, mo, dy] = dateStr.split('-');
  return `${parseInt(dy)} ${MONTH_SHORT[parseInt(mo) - 1]} '${yr.slice(2)}`;
};

const getLast6Months = () => {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return MONTH_SHORT[d.getMonth()] + ' ' + d.getFullYear();
  });
};

const getLast30Days = () => {
  const now = new Date();
  return [0, 6, 12, 18, 24, 29].map((offset) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (29 - offset));
    return MONTH_SHORT[d.getMonth()] + ' ' + String(d.getDate()).padStart(2, '0');
  });
};

const EMPTY_REG_DATA = getLast30Days().map((date) => ({ date, cumulative: 0 }));

// All 5 games always shown in legend (display names)
const ALL_GAMES = ['BGMI', 'Valorant', 'Free Fire', 'COD Mobile', 'Scarfall'];

// Backend game_name → display name normalization
const GAME_NAME_MAP = {
  Freefire: 'Free Fire',
  'Free Fire': 'Free Fire',
  COD: 'COD Mobile',
  'COD Mobile': 'COD Mobile',
  BGMI: 'BGMI',
  Valorant: 'Valorant',
  Scarfall: 'Scarfall',
};

const GAME_COLORS = [
  'hsl(265 80% 65%)',
  'hsl(265 60% 50%)',
  'hsl(265 85% 75%)',
  'hsl(265 50% 40%)',
  'hsl(265 40% 60%)',
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-card px-3 py-2 text-xs shadow-xl">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: entry.color }} />
          {entry.name}:{' '}
          <span className="font-semibold">
            {typeof entry.value === 'number' && entry.value > 999
              ? `₹${entry.value.toLocaleString()}`
              : entry.value}
          </span>
        </p>
      ))}
    </div>
  );
};

/* ──────────────────── ALL TOURNAMENTS VIEW ──────────────────── */
const AllTournamentsView = ({
  analyticsData,
  filteredKpis,
  filteredRegTrend,
  filteredRevTrend,
  filteredEngagement,
  setSelectedTournament,
}) => {
  const kpis = filteredKpis || analyticsData.kpis;

  // Compute month-over-month change for revenue and registrations from trend data
  const computeChange = (trendArr, valueKey) => {
    if (!trendArr || trendArr.length < 2) return null;
    const cur = trendArr[trendArr.length - 1]?.[valueKey] || 0;
    const prev = trendArr[trendArr.length - 2]?.[valueKey] || 0;
    if (prev === 0) return cur > 0 ? { pct: null, label: 'New', up: true } : null;
    const pct = Math.round(((cur - prev) / prev) * 100);
    return { pct, label: `${pct >= 0 ? '+' : ''}${pct}%`, up: pct >= 0 };
  };

  const revChange = computeChange(analyticsData.revenue_trend, 'revenue');
  // For registrations use daily trend: sum last 30 days vs prior 30 days
  const regChange = (() => {
    const trend = analyticsData.registration_trend || [];
    if (trend.length < 2) return null;
    const mid = Math.floor(trend.length / 2);
    const cur = trend.slice(mid).reduce((s, d) => s + (d.registrations || 0), 0);
    const prev = trend.slice(0, mid).reduce((s, d) => s + (d.registrations || 0), 0);
    if (prev === 0) return cur > 0 ? { pct: null, label: 'New', up: true } : null;
    const pct = Math.round(((cur - prev) / prev) * 100);
    return { pct, label: `${pct >= 0 ? '+' : ''}${pct}%`, up: pct >= 0 };
  })();

  // Normalize backend game names to display names and merge duplicates
  const normalizedGameDist = (() => {
    const raw = analyticsData.game_distribution || [];
    const merged = {};
    for (const entry of raw) {
      const display = GAME_NAME_MAP[entry.name] || entry.name;
      merged[display] = (merged[display] || 0) + entry.value;
    }
    return Object.entries(merged).map(([name, value]) => ({ name, value }));
  })();

  const kpiCards = [
    {
      label: 'Total Revenue',
      value: `₹${(kpis.total_revenue || 0).toLocaleString('en-IN')}`,
      change: revChange,
      Icon: IndianRupee,
      color: 'text-green-500',
    },
    {
      label: 'Total Registrations',
      value: String(kpis.total_registrations || 0),
      change: regChange,
      Icon: Users,
      color: 'text-accent',
    },
    {
      label: 'Avg Fill Rate',
      value: `${(kpis.avg_fill_rate || 0).toFixed(1)}%`,
      change: null,
      Icon: Percent,
      color: 'text-blue-400',
    },
    {
      label: 'Returning Players',
      value: `${(kpis.returning_players_pct || 0).toFixed(1)}%`,
      change: null,
      Icon: UserCheck,
      color: 'text-yellow-500',
    },
    {
      label: 'Avg Drop-off',
      value: `${(kpis.avg_dropoff || 0).toFixed(1)}%`,
      change: null,
      Icon: ArrowDownRight,
      color: 'text-red-400',
    },
    {
      label: 'Tournaments Hosted',
      value: String(kpis.tournaments_hosted || 0),
      change: null,
      Icon: Trophy,
      color: 'text-accent',
    },
  ];

  // Has real non-zero data checks
  const hasRegData = filteredRegTrend.some((d) => d.cumulative > 0);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
        {kpiCards.map((card, i) => (
          <div key={i} className="ha-card p-2.5 md:p-3">
            <div className="flex items-center justify-between mb-1.5">
              <card.Icon className={`h-3.5 w-3.5 md:h-4 md:w-4 ${card.color}`} />
              {card.change && (
                <span
                  className={`text-[9px] md:text-[10px] font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${card.change.up ? 'text-green-400 bg-green-400/15' : 'text-red-400 bg-red-400/15'}`}
                >
                  {card.change.up ? (
                    <ArrowUpRight className="h-2.5 w-2.5" />
                  ) : (
                    <ArrowDownRight className="h-2.5 w-2.5" />
                  )}
                  {card.change.label}
                </span>
              )}
            </div>
            <div className="text-base md:text-lg font-black text-foreground">{card.value}</div>
            <div className="text-[9px] md:text-[10px] text-muted-foreground">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        {/* Registrations Over Time */}
        <div className="ha-card">
          <div className="p-3 md:p-4 pb-2">
            <h3 className="text-xs md:text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" /> Registrations Over Time
            </h3>
          </div>
          <div className="p-3 md:p-4 pt-0">
            <div className="h-[180px] md:h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hasRegData ? filteredRegTrend : EMPTY_REG_DATA}>
                  <defs>
                    <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(265 80% 65%)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(265 80% 65%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 8% 20%)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'hsl(220 5% 55%)', fontSize: 10 }}
                    tickFormatter={formatDateTick}
                  />
                  <YAxis tick={{ fill: 'hsl(220 5% 55%)', fontSize: 10 }} domain={[0, 'auto']} />
                  <Tooltip content={<CustomTooltip />} labelFormatter={formatDateTick} />
                  {(hasRegData ? filteredRegTrend : EMPTY_REG_DATA).map((d) => (
                    <ReferenceLine
                      key={d.date}
                      x={d.date}
                      stroke="hsl(220 8% 28%)"
                      strokeDasharray="3 3"
                      strokeWidth={1}
                    />
                  ))}
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    stroke="hsl(265 80% 65%)"
                    fill="url(#regGrad)"
                    strokeWidth={2}
                    name="Total"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Revenue Trend */}
        <div className="ha-card">
          <div className="p-3 md:p-4 pb-2">
            <h3 className="text-xs md:text-sm font-semibold flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-green-500" /> Revenue Trend
            </h3>
          </div>
          <div className="p-3 md:p-4 pt-0">
            <div className="h-[180px] md:h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredRevTrend}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(140 60% 45%)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(140 60% 45%)" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 8% 20%)" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(220 5% 55%)', fontSize: 10 }} />
                  <YAxis
                    tick={{ fill: 'hsl(220 5% 55%)', fontSize: 10 }}
                    domain={[0, 'auto']}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {filteredRevTrend.map((d) => (
                    <ReferenceLine
                      key={d.month}
                      x={d.month}
                      stroke="hsl(220 8% 28%)"
                      strokeDasharray="3 3"
                      strokeWidth={1}
                    />
                  ))}
                  <Bar
                    dataKey="revenue"
                    fill="url(#revGrad)"
                    radius={[6, 6, 0, 0]}
                    name="Revenue"
                    maxBarSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
        {/* Returning vs New */}
        <div className="ha-card lg:col-span-2">
          <div className="p-3 md:p-4 pb-2">
            <h3 className="text-xs md:text-sm font-semibold flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-blue-400" /> Returning vs New Players
            </h3>
          </div>
          <div className="p-3 md:p-4 pt-0">
            <div className="h-[180px] md:h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredEngagement}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 8% 20%)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: 'hsl(220 5% 55%)', fontSize: 10 }}
                    axisLine={{ stroke: 'hsl(220 8% 20%)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'hsl(220 5% 55%)', fontSize: 10 }}
                    domain={[0, 'auto']}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar
                    dataKey="returning"
                    stackId="a"
                    fill="hsl(265 80% 65%)"
                    name="Returning"
                    maxBarSize={60}
                  />
                  <Bar
                    dataKey="new"
                    stackId="a"
                    fill="hsl(265 85% 75%)"
                    radius={[4, 4, 0, 0]}
                    name="New"
                    maxBarSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* By Game Pie */}
        <div className="ha-card">
          <div className="p-3 md:p-4 pb-2">
            <h3 className="text-xs md:text-sm font-semibold flex items-center gap-2">
              <Gamepad2 className="h-4 w-4 text-accent" /> By Game
            </h3>
          </div>
          <div className="p-3 md:p-4 pt-0">
            <div className="h-[160px] md:h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={
                      normalizedGameDist.length > 0 ? normalizedGameDist : [{ name: '', value: 1 }]
                    }
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={normalizedGameDist.length > 0 ? 3 : 0}
                    dataKey="value"
                    stroke="none"
                  >
                    {(normalizedGameDist.length > 0
                      ? normalizedGameDist
                      : [{ name: '', value: 1 }]
                    ).map((_, i) => (
                      <Cell
                        key={i}
                        fill={
                          normalizedGameDist.length > 0
                            ? GAME_COLORS[i % GAME_COLORS.length]
                            : 'hsl(220 8% 18%)'
                        }
                      />
                    ))}
                  </Pie>
                  {normalizedGameDist.length > 0 && <Tooltip content={<CustomTooltip />} />}
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 justify-center mt-2">
              {ALL_GAMES.map((game, i) => {
                const entry = normalizedGameDist.find((g) => g.name === game);
                const pct = entry ? entry.value : 0;
                return (
                  <div
                    key={game}
                    className="flex items-center gap-1 text-[9px] md:text-[10px] text-muted-foreground"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: GAME_COLORS[i] }}
                    />
                    {game} ({pct}%)
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Per-Tournament Table */}
      <div className="ha-card">
        <div className="p-3 md:p-4 pb-2 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-accent" />
          <h3 className="text-xs md:text-sm font-semibold">Per-Tournament Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] md:text-xs min-w-[600px]">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left p-2.5 md:p-3 text-muted-foreground font-medium">
                  Tournament
                </th>
                <th className="text-left p-2.5 md:p-3 text-muted-foreground font-medium">Game</th>
                <th className="text-center p-2.5 md:p-3 text-muted-foreground font-medium">
                  Teams
                </th>
                <th className="text-center p-2.5 md:p-3 text-muted-foreground font-medium">
                  Fill Rate
                </th>
                <th className="text-right p-2.5 md:p-3 text-muted-foreground font-medium">
                  Revenue
                </th>
                <th className="text-center p-2.5 md:p-3 text-muted-foreground font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.tournaments?.length > 0 ? (
                analyticsData.tournaments.map((t, i) => (
                  <tr
                    key={i}
                    className="border-b border-border/20 hover:bg-secondary/10 transition-colors cursor-pointer"
                    onClick={() => setSelectedTournament(t.id)}
                  >
                    <td className="p-2.5 md:p-3 font-medium text-foreground">{t.name}</td>
                    <td className="p-2.5 md:p-3 text-muted-foreground">
                      {GAME_NAME_MAP[t.game] || t.game}
                    </td>
                    <td className="p-2.5 md:p-3 text-center">
                      {t.registrations}/{t.capacity}
                    </td>
                    <td className="p-2.5 md:p-3">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-12 md:w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${t.fill_rate >= 90 ? 'bg-green-500' : t.fill_rate >= 70 ? 'bg-yellow-500' : 'bg-red-400'}`}
                            style={{ width: `${t.fill_rate}%` }}
                          />
                        </div>
                        <span className="text-muted-foreground">{t.fill_rate}%</span>
                      </div>
                    </td>
                    <td className="p-2.5 md:p-3 text-right font-semibold">
                      ₹{(t.revenue || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="p-2.5 md:p-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-medium border ${
                          t.status === 'ongoing'
                            ? 'bg-green-500/15 text-green-400 border-green-500/30'
                            : t.status === 'upcoming'
                              ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                              : 'bg-secondary/50 text-muted-foreground border-border/30'
                        }`}
                      >
                        {t.status === 'ongoing' ? 'live' : t.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center p-8 text-muted-foreground text-xs">
                    No tournaments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ──────────────────── SINGLE TOURNAMENT VIEW ──────────────────── */
const SingleTournamentView = ({ t, setSelectedTournament, navigate }) => {
  const [teamsVisible, setTeamsVisible] = useState(5);
  const total = (t.engagement?.returning || 0) + (t.engagement?.new || 0);
  const returningPct = total > 0 ? ((t.engagement.returning / total) * 100).toFixed(1) : 0;
  const newPct = total > 0 ? ((t.engagement.new / total) * 100).toFixed(1) : 0;

  const kpiStats = [
    {
      label: 'Registrations',
      value: `${t.registrations}/${t.capacity}`,
      Icon: Users,
      color: 'text-accent',
      change: `${t.fill_rate}% filled`,
    },
    {
      label: 'Revenue',
      value: `₹${(t.revenue || 0).toLocaleString('en-IN')}`,
      Icon: IndianRupee,
      color: 'text-green-500',
      change: null,
    },
    {
      label: 'Returning',
      value: `${returningPct}%`,
      Icon: UserCheck,
      color: 'text-yellow-500',
      change: `${t.engagement?.returning || 0} players`,
    },
    {
      label: 'New Players',
      value: String(t.engagement?.new || 0),
      Icon: UserPlus,
      color: 'text-blue-400',
      change: 'this event',
    },
    {
      label: 'Peak Viewers',
      value: 'N/A',
      Icon: Trophy,
      color: 'text-accent',
      change: 'Upcoming',
    },
    {
      label: 'Satisfaction',
      value: 'N/A',
      Icon: Trophy,
      color: 'text-yellow-500',
      change: 'rating',
    },
  ];

  const quickStats = [
    { label: 'Total Teams', value: String(t.registrations || 0), Icon: Users },
    { label: 'Fill Rate', value: `${t.fill_rate || 0}%`, Icon: Target },
    { label: 'Rating', value: 'N/A', Icon: Shield },
    { label: 'Capacity', value: String(t.capacity || 0), Icon: Zap },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Back button */}
      <button
        onClick={() => setSelectedTournament('All Tournaments')}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2 transition-colors"
      >
        ← All Tournaments
      </button>

      {/* Tournament Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <h3 className="text-base md:text-lg font-bold text-foreground">{t.name}</h3>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
            t.status === 'ongoing'
              ? 'bg-green-500/15 text-green-400 border-green-500/30'
              : t.status === 'upcoming'
                ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                : 'bg-secondary/50 text-muted-foreground border-border/30'
          }`}
        >
          {t.status === 'ongoing' ? 'live' : t.status}
        </span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border border-accent/30 text-accent">
          {t.game}
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
        {kpiStats.map((stat, i) => (
          <div key={i} className="ha-card p-2.5 md:p-3">
            <div className="flex items-center justify-between mb-1.5">
              <stat.Icon className={`h-3.5 w-3.5 md:h-4 md:w-4 ${stat.color}`} />
              {stat.change && (
                <span className="text-[9px] md:text-[10px] font-medium text-muted-foreground">
                  {stat.change}
                </span>
              )}
            </div>
            <div className="text-base md:text-lg font-black text-foreground">{stat.value}</div>
            <div className="text-[9px] md:text-[10px] text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
        {quickStats.map((s, i) => (
          <div key={i} className="ha-card p-2.5 md:p-3 flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-accent/10">
              <s.Icon className="h-3.5 w-3.5 text-accent" />
            </div>
            <div>
              <div className="text-sm md:text-base font-bold text-foreground">{s.value}</div>
              <div className="text-[9px] md:text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        {/* Registration Trend */}
        <div className="ha-card">
          <div className="p-3 md:p-4 pb-2">
            <h3 className="text-xs md:text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" /> Registration Trend
            </h3>
          </div>
          <div className="p-3 md:p-4 pt-0">
            <div className="h-[180px] md:h-[220px]">
              {(() => {
                // Pad registration_trend with anchor points across a 30-day span
                const rawTrend = t.registration_trend || [];
                const now = new Date();
                const days = 30;
                const cutoff = new Date(now - days * 24 * 60 * 60 * 1000);
                const dateMap = {};
                let runningCumulative = 0;
                rawTrend.forEach((d) => {
                  dateMap[d.date] = d;
                  runningCumulative = d.cumulative;
                });
                const step = Math.max(1, Math.floor(days / 5));
                for (let i = 0; i <= days; i += step) {
                  const d = new Date(cutoff.getTime() + i * 24 * 60 * 60 * 1000);
                  const key = d.toISOString().slice(0, 10);
                  if (!dateMap[key]) {
                    dateMap[key] = { date: key, registrations: 0, cumulative: 0 };
                  }
                }
                const todayKey = now.toISOString().slice(0, 10);
                if (!dateMap[todayKey]) {
                  dateMap[todayKey] = {
                    date: todayKey,
                    registrations: 0,
                    cumulative: runningCumulative,
                  };
                }
                const chartData = Object.values(dateMap).sort((a, b) =>
                  a.date.localeCompare(b.date)
                );
                return (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="tRegGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(265 80% 65%)" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="hsl(265 80% 65%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 8% 20%)" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: 'hsl(220 5% 55%)', fontSize: 10 }}
                        tickFormatter={formatDateTick}
                      />
                      <YAxis
                        tick={{ fill: 'hsl(220 5% 55%)', fontSize: 10 }}
                        domain={[0, 'auto']}
                      />
                      <Tooltip content={<CustomTooltip />} labelFormatter={formatDateTick} />
                      {chartData.map((d) => (
                        <ReferenceLine
                          key={d.date}
                          x={d.date}
                          stroke="hsl(220 8% 28%)"
                          strokeDasharray="3 3"
                          strokeWidth={1}
                        />
                      ))}
                      <Area
                        type="monotone"
                        dataKey="cumulative"
                        stroke="hsl(265 80% 65%)"
                        fill="url(#tRegGrad)"
                        strokeWidth={2}
                        name="Total"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Revenue Collected */}
        <div className="ha-card">
          <div className="p-3 md:p-4 pb-2">
            <h3 className="text-xs md:text-sm font-semibold flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-green-500" /> Revenue Collected
            </h3>
          </div>
          <div className="p-3 md:p-4 pt-0">
            <div className="h-[180px] md:h-[220px]">
              {(() => {
                // Pad revenue_trend to always show all 6 months
                const months6 = getLast6Months();
                const revMap = {};
                (t.revenue_trend || []).forEach((r) => {
                  revMap[r.month] = r.revenue;
                });
                const chartData = months6.map((m) => ({ month: m, revenue: revMap[m] || 0 }));
                return (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <defs>
                        <linearGradient id="tRevGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(140 60% 45%)" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="hsl(140 60% 45%)" stopOpacity={0.2} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 8% 20%)" />
                      <XAxis dataKey="month" tick={{ fill: 'hsl(220 5% 55%)', fontSize: 10 }} />
                      <YAxis
                        tick={{ fill: 'hsl(220 5% 55%)', fontSize: 10 }}
                        domain={[0, 'auto']}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      {chartData.map((d) => (
                        <ReferenceLine
                          key={d.month}
                          x={d.month}
                          stroke="hsl(220 8% 28%)"
                          strokeDasharray="3 3"
                          strokeWidth={1}
                        />
                      ))}
                      <Bar
                        dataKey="revenue"
                        fill="url(#tRevGrad)"
                        radius={[6, 6, 0, 0]}
                        name="Revenue"
                        maxBarSize={60}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Player Engagement */}
      <div className="ha-card">
        <div className="p-3 md:p-4 pb-2">
          <h3 className="text-xs md:text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-400" /> Player Engagement
          </h3>
        </div>
        <div className="p-3 md:p-4 pt-0">
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Returning</span>
                <span className="font-semibold">{t.engagement?.returning || 0}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all"
                  style={{ width: `${total > 0 ? (t.engagement.returning / total) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">New</span>
                <span className="font-semibold">{t.engagement?.new || 0}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all"
                  style={{ width: `${total > 0 ? (t.engagement.new / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
          <div className="mt-3 text-[10px] text-muted-foreground text-center">
            {returningPct}% returning · {newPct}% new players
          </div>
        </div>
      </div>

      {/* All Registered Teams */}
      <div className="ha-card">
        <div className="p-3 md:p-4 pb-2 flex items-center gap-2">
          <Shield className="h-4 w-4 text-accent" />
          <h3 className="text-xs md:text-sm font-semibold">
            All Registered Teams ({t.teams?.length ?? t.registrations ?? 0})
          </h3>
        </div>
        <div className="divide-y divide-border/20">
          {t.teams && t.teams.length > 0 ? (
            <>
              {t.teams.slice(0, teamsVisible).map((team, i) => (
                <div
                  key={team.id ?? i}
                  className="flex items-center justify-between px-3 md:px-4 py-2.5 hover:bg-secondary/10 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <span className="text-[10px] md:text-xs font-bold text-accent">
                        {team.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs md:text-sm font-medium text-foreground">{team.name}</p>
                      <p className="text-[9px] md:text-[10px] text-muted-foreground">
                        {team.players} players · Joined {team.registered_at}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/team/${team.id}`)}
                    className="flex items-center gap-1 text-[10px] h-7 px-2.5 rounded-md text-accent hover:bg-accent/10 transition-colors font-medium"
                  >
                    <Eye className="h-3 w-3" /> View
                  </button>
                </div>
              ))}
              {teamsVisible < t.teams.length && (
                <button
                  onClick={() => setTeamsVisible((v) => v + 5)}
                  className="w-full py-2.5 text-xs text-accent hover:bg-accent/5 transition-colors font-medium"
                >
                  View more ({t.teams.length - teamsVisible} remaining)
                </button>
              )}
            </>
          ) : (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">
              No teams registered yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ──────────────────── MAIN COMPONENT ──────────────────── */
const HostAnalyticsView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [selectedTournament, setSelectedTournament] = useState(() => {
    return searchParams.get('id') || 'All Tournaments';
  });
  const [timeRange, setTimeRange] = useState(() => {
    return searchParams.get('range') || '30d';
  });

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    let changed = false;
    if (selectedTournament && params.get('id') !== String(selectedTournament)) {
      params.set('id', selectedTournament);
      changed = true;
    }
    if (timeRange && params.get('range') !== timeRange) {
      params.set('range', timeRange);
      changed = true;
    }
    if (changed) {
      setSearchParams(params, { replace: true });
    }
  }, [selectedTournament, timeRange, searchParams, setSearchParams]);

  const [tDropdownOpen, setTDropdownOpen] = useState(false);
  const [trDropdownOpen, setTrDropdownOpen] = useState(false);
  const [tSearch, setTSearch] = useState('');
  const tDropRef = useRef(null);
  const trDropRef = useRef(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await tournamentAPI.getHostAnalytics();
      setAnalyticsData(res.data);
    } catch (err) {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (tDropRef.current && !tDropRef.current.contains(e.target)) {
        setTDropdownOpen(false);
        setTSearch('');
      }
      if (trDropRef.current && !trDropRef.current.contains(e.target)) setTrDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Time range filter — fills full span with zero-value anchor points so x-axis always shows the range
  const filteredRegTrend = useMemo(() => {
    if (!analyticsData?.registration_trend) return [];
    const rawData = analyticsData.registration_trend;
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 180;
    const now = new Date();
    const cutoff = new Date(now - days * 24 * 60 * 60 * 1000);

    // Filter raw data to the selected range
    const inRange = rawData.filter((d) => new Date(d.date) >= cutoff);

    // Build a map keyed by date string for fast lookup
    const dateMap = {};
    let runningCumulative = 0;
    inRange.forEach((d) => {
      dateMap[d.date] = d;
      runningCumulative = d.cumulative;
    });

    // Generate evenly-spaced anchor dates so recharts always renders a full x-axis span
    const step = Math.max(1, Math.floor(days / 5));
    for (let i = 0; i <= days; i += step) {
      const d = new Date(cutoff.getTime() + i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      if (!dateMap[key]) {
        dateMap[key] = { date: key, registrations: 0, cumulative: 0 };
      }
    }
    // Ensure today is always included
    const todayKey = now.toISOString().slice(0, 10);
    if (!dateMap[todayKey]) {
      dateMap[todayKey] = { date: todayKey, registrations: 0, cumulative: runningCumulative };
    }

    // Sort all points by date
    return Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [analyticsData, timeRange]);

  // Revenue trend — always shows all 6 months padded (day filter doesn't affect these charts)
  const filteredRevTrend = useMemo(() => {
    const months6 = getLast6Months();
    const revMap = {};
    (analyticsData?.revenue_trend || []).forEach((r) => {
      revMap[r.month] = r.revenue;
    });
    return months6.map((m) => ({ month: m, revenue: revMap[m] || 0 }));
  }, [analyticsData]);

  // Engagement — always shows all 6 months padded (day filter doesn't affect these charts)
  const filteredEngagement = useMemo(() => {
    const months6 = getLast6Months();
    const engMap = {};
    (analyticsData?.engagement || []).forEach((e) => {
      engMap[e.month] = e;
    });
    return months6.map((m) => engMap[m] || { month: m, returning: 0, new: 0 });
  }, [analyticsData]);

  // KPI values filtered by timeRange — registrations, revenue, returning% recomputed for the window
  const filteredKpis = useMemo(() => {
    if (!analyticsData) return null;
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 180;
    const now = new Date();
    const cutoff = new Date(now - days * 24 * 60 * 60 * 1000);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    // Registrations in range from daily trend
    const totalRegs = (analyticsData.registration_trend || [])
      .filter((d) => d.date >= cutoffStr)
      .reduce((sum, d) => sum + d.registrations, 0);

    // Revenue in range — months that start on or after the cutoff month
    const cutoffMonthStart = new Date(cutoff.getFullYear(), cutoff.getMonth(), 1);
    const totalRev = (analyticsData.revenue_trend || [])
      .filter((r) => {
        const parts = r.month.split(' ');
        const mIdx = MONTH_SHORT.indexOf(parts[0]);
        const yr = parseInt(parts[1]);
        return new Date(yr, mIdx, 1) >= cutoffMonthStart;
      })
      .reduce((sum, r) => sum + r.revenue, 0);

    return {
      ...analyticsData.kpis,
      total_registrations: totalRegs,
      total_revenue: totalRev,
      // returning_players_pct: use backend value directly — the engagement monthly data
      // can't reliably detect returning players when all tournaments ran in the same month
      returning_players_pct: analyticsData.kpis?.returning_players_pct ?? 0,
    };
  }, [analyticsData, timeRange]);

  const triggerDownload = (csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const escapeCSV = (val) => {
    const s = String(val ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const exportAllCSV = () => {
    if (!analyticsData) return;
    const rows = [];

    if (filteredKpis) {
      rows.push([`Summary (${timeRange === 'all' ? 'All Time' : `Last ${timeRange}`})`]);
      rows.push(['Metric', 'Value']);
      rows.push(['Total Revenue (₹)', filteredKpis.total_revenue]);
      rows.push(['Total Registrations', filteredKpis.total_registrations]);
      rows.push(['Avg Fill Rate %', filteredKpis.avg_fill_rate]);
      rows.push(['Returning Players %', filteredKpis.returning_players_pct]);
      rows.push(['Avg Drop-off %', filteredKpis.avg_dropoff]);
      rows.push(['Tournaments Hosted', filteredKpis.tournaments_hosted]);
      rows.push([]);
    }

    if (analyticsData.tournaments?.length > 0) {
      rows.push(['Tournaments']);
      rows.push([
        'Tournament',
        'Game',
        'Registrations',
        'Capacity',
        'Fill Rate %',
        'Revenue (₹)',
        'Status',
      ]);
      analyticsData.tournaments.forEach((t) =>
        rows.push([t.name, t.game, t.registrations, t.capacity, t.fill_rate, t.revenue, t.status])
      );
      rows.push([]);
    }

    if (filteredRegTrend?.length > 0) {
      rows.push(['Registration Trend']);
      rows.push(['Date', 'Daily Registrations', 'Cumulative']);
      filteredRegTrend.forEach((d) => rows.push([d.date, d.registrations, d.cumulative]));
      rows.push([]);
    }

    if (filteredRevTrend?.length > 0) {
      rows.push(['Revenue Trend']);
      rows.push(['Month', 'Revenue (₹)']);
      filteredRevTrend.forEach((r) => rows.push([r.month, r.revenue]));
    }

    triggerDownload(
      rows.map((r) => r.map(escapeCSV).join(',')).join('\n'),
      'scrimverse-analytics.csv'
    );
  };

  const exportTournamentCSV = (t) => {
    const rows = [];

    rows.push(['Tournament Summary']);
    rows.push([
      'Tournament',
      'Game',
      'Status',
      'Registrations',
      'Capacity',
      'Fill Rate %',
      'Revenue (₹)',
    ]);
    rows.push([t.name, t.game, t.status, t.registrations, t.capacity, t.fill_rate, t.revenue]);
    rows.push([]);

    if (t.registration_trend?.length > 0) {
      rows.push(['Registration Trend']);
      rows.push(['Date', 'Daily Registrations', 'Cumulative']);
      t.registration_trend.forEach((d) => rows.push([d.date, d.registrations, d.cumulative]));
      rows.push([]);
    }

    if (t.revenue_trend?.length > 0) {
      rows.push(['Revenue Trend']);
      rows.push(['Month', 'Revenue (₹)']);
      t.revenue_trend.forEach((r) => rows.push([r.month, r.revenue]));
      rows.push([]);
    }

    if (t.engagement) {
      rows.push(['Player Engagement']);
      rows.push(['Returning Players', 'New Players']);
      rows.push([t.engagement.returning, t.engagement.new]);
    }

    const slug = (t.name || 'tournament').replace(/\s+/g, '-').replace(/[^a-z0-9_-]/gi, '');
    triggerDownload(
      rows.map((r) => r.map(escapeCSV).join(',')).join('\n'),
      `scrimverse-${slug}.csv`
    );
  };

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="ha-skeleton h-20 md:h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
          <div className="ha-skeleton h-[220px]" />
          <div className="ha-skeleton h-[220px]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <BarChart3 size={40} className="text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <button onClick={fetchAnalytics} className="text-xs text-accent hover:underline">
          Retry
        </button>
      </div>
    );
  }

  const isAll = selectedTournament === 'All Tournaments';
  const selectedT =
    !isAll && analyticsData?.tournaments
      ? analyticsData.tournaments.find((t) => t.id === selectedTournament)
      : null;

  const timeRangeLabel =
    timeRange === '7d'
      ? 'Last 7 days'
      : timeRange === '30d'
        ? 'Last 30 days'
        : timeRange === '90d'
          ? 'Last 90 days'
          : 'All time';

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {/* Tournament dropdown */}
          <div className="relative" ref={tDropRef}>
            <button
              onClick={() => {
                setTDropdownOpen((v) => !v);
                setTrDropdownOpen(false);
              }}
              className="w-full sm:w-[220px] h-8 text-xs flex items-center justify-between gap-1.5 px-3 rounded-lg bg-secondary/30 border border-border/40 text-foreground"
            >
              <span className="truncate">
                {selectedTournament === 'All Tournaments'
                  ? 'All Tournaments'
                  : analyticsData?.tournaments?.find((t) => t.id === selectedTournament)?.name ||
                    'All Tournaments'}
              </span>
              <ChevronDown
                size={12}
                className={
                  tDropdownOpen ? 'rotate-180 transition-transform' : 'transition-transform'
                }
              />
            </button>
            {tDropdownOpen && (
              <div className="absolute top-[calc(100%+4px)] left-0 z-50 min-w-[220px] bg-background border border-border/60 rounded-xl shadow-2xl overflow-hidden">
                {/* Search input */}
                <div className="px-2 py-1.5 border-b border-border/20">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/30 border border-border/30">
                    <Search size={11} style={{ opacity: 0.5, flexShrink: 0 }} />
                    <input
                      type="text"
                      placeholder="Search tournaments..."
                      value={tSearch}
                      onChange={(e) => setTSearch(e.target.value)}
                      className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/50 min-w-0"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                {/* Scrollable list */}
                <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                  {[
                    { id: 'All Tournaments', name: 'All Tournaments' },
                    ...(analyticsData?.tournaments || []),
                  ]
                    .filter(
                      (item) =>
                        !tSearch.trim() ||
                        item.name.toLowerCase().includes(tSearch.trim().toLowerCase())
                    )
                    .map((item, i) => (
                      <button
                        key={i}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-secondary/40 transition-colors ${selectedTournament === item.id ? 'bg-accent/10 text-accent' : 'text-foreground'}`}
                        onClick={() => {
                          setSelectedTournament(item.id);
                          setTDropdownOpen(false);
                          setTSearch('');
                        }}
                      >
                        {item.name}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Time range dropdown */}
          <div className="relative" ref={trDropRef}>
            <button
              onClick={() => {
                setTrDropdownOpen((v) => !v);
                setTDropdownOpen(false);
              }}
              className="w-[130px] h-8 text-xs flex items-center justify-between gap-1.5 px-3 rounded-lg bg-secondary/30 border border-border/40 text-foreground"
            >
              <span>{timeRangeLabel}</span>
              <ChevronDown
                size={12}
                className={
                  trDropdownOpen ? 'rotate-180 transition-transform' : 'transition-transform'
                }
              />
            </button>
            {trDropdownOpen && (
              <div className="absolute top-[calc(100%+4px)] left-0 z-50 min-w-[130px] bg-background border border-border/60 rounded-xl shadow-2xl overflow-hidden">
                {[
                  ['7d', 'Last 7 days'],
                  ['30d', 'Last 30 days'],
                  ['90d', 'Last 90 days'],
                  ['all', 'All time'],
                ].map(([val, label]) => (
                  <button
                    key={val}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-secondary/40 transition-colors ${timeRange === val ? 'bg-accent/10 text-accent' : 'text-foreground'}`}
                    onClick={() => {
                      setTimeRange(val);
                      setTrDropdownOpen(false);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {analyticsData && (
          <button
            onClick={() => (isAll ? exportAllCSV() : selectedT && exportTournamentCSV(selectedT))}
            className="flex items-center gap-1.5 text-xs h-8 px-3 rounded-lg border border-border/40 bg-secondary/20 text-foreground hover:bg-secondary/40 transition-colors"
          >
            <Download size={13} />
            Export CSV
          </button>
        )}
      </div>

      {/* Content */}
      {isAll || !selectedT ? (
        <AllTournamentsView
          analyticsData={analyticsData}
          filteredKpis={filteredKpis}
          filteredRegTrend={filteredRegTrend}
          filteredRevTrend={filteredRevTrend}
          filteredEngagement={filteredEngagement}
          setSelectedTournament={setSelectedTournament}
        />
      ) : (
        <SingleTournamentView
          t={selectedT}
          setSelectedTournament={setSelectedTournament}
          navigate={navigate}
        />
      )}
    </div>
  );
};

export default HostAnalyticsView;
