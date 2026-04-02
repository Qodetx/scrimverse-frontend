import React, { useState, useEffect, useRef } from 'react';
import { tournamentAPI } from '../../../utils/api';
import './BulkScheduleModal.css';

const MAP_PRESETS = {
  BGMI: ['Erangel', 'Miramar', 'Vikendi', 'Sanhok', 'Livik', 'Karakin'],
  COD: ['Standoff', 'Crossfire', 'Crash', 'Nuketown', 'Raid', 'Summit'],
  Valorant: ['Ascent', 'Bind', 'Haven', 'Split', 'Icebox', 'Breeze', 'Fracture', 'Pearl'],
  Freefire: ['Bermuda', 'Purgatory', 'Kalahari', 'Alpine'],
  Scarfall: ['Map 1', 'Map 2', 'Map 3'],
};

/* ── Custom Select ─────────────────────────────────────────────────────────── */
const CustomSelect = ({ value, onChange, options, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleToggle = () => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropUp(spaceBelow < 180);
    }
    setOpen((v) => !v);
  };

  const selected = options.find((o) => String(o.value) === String(value));

  return (
    <div className="bsm-select-root" ref={ref}>
      <button
        type="button"
        className={`bsm-select-trigger${open ? ' open' : ''}`}
        onClick={handleToggle}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <svg className="bsm-select-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className={`bsm-select-content${dropUp ? ' drop-up' : ''}`}>
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`bsm-select-item${String(opt.value) === String(value) ? ' selected' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {String(opt.value) === String(value) && (
                <svg
                  className="bsm-select-check"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── 5v5 Lobby Row UI (accordion) ─────────────────────────────────────────── */
const LobbyRow = ({ lobby, lobbyIndex, gameMaps, onChange }) => {
  const [open, setOpen] = useState(false);
  const { teams = [], time, date, map } = lobby;
  // Team names come from group.teams array
  const team1 = teams[0]?.team_name || 'TBD';
  const team2 = teams[1]?.team_name || (teams.length > 2 ? `+${teams.length - 1} more` : 'TBD');

  const mapOptions = [
    ...gameMaps.map((m) => ({ value: m, label: m })),
    { value: 'other', label: 'Other...' },
  ];

  return (
    <div className={`bsm-lobby-row${open ? ' bsm-lobby-row--open' : ''}`}>
      {/* ── Collapsed header ── */}
      <button type="button" className="bsm-lobby-header" onClick={() => setOpen((v) => !v)}>
        <span className="bsm-lobby-badge">Lobby {lobbyIndex + 1}</span>
        <span className="bsm-lobby-teams">
          <span className="bsm-team">{team1}</span>
          <span className="bsm-vs">vs</span>
          <span className="bsm-team">{team2}</span>
        </span>
        <span className="bsm-lobby-summary">
          {time} · {date} · {map}
        </span>
        <svg
          className={`bsm-lobby-chevron${open ? ' rotated' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* ── Expanded inputs ── */}
      {open && (
        <div className="bsm-lobby-body">
          <div className="bsm-lobby-field bsm-lobby-field--grow">
            <label className="bsm-lobby-label">Time</label>
            <input
              type="time"
              className="bsm-lobby-input"
              value={time}
              onChange={(e) => onChange(lobbyIndex, 'time', e.target.value)}
            />
          </div>
          <div className="bsm-lobby-field bsm-lobby-field--grow">
            <label className="bsm-lobby-label">Date</label>
            <input
              type="date"
              className="bsm-lobby-input"
              value={date}
              onChange={(e) => onChange(lobbyIndex, 'date', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="bsm-lobby-field bsm-lobby-field--grow">
            <label className="bsm-lobby-label">Map</label>
            <CustomSelect
              value={map}
              onChange={(v) => onChange(lobbyIndex, 'map', v)}
              options={mapOptions}
              placeholder="Select map"
            />
          </div>
        </div>
      )}
    </div>
  );
};

/* ── 5v5 Bulk Schedule View ────────────────────────────────────────────────── */
const BulkSchedule5v5 = ({
  tournament,
  currentRound,
  groups,
  onClose,
  onSuccess,
  loading,
  setLoading,
}) => {
  const gameMaps = MAP_PRESETS[tournament?.game_name] || MAP_PRESETS.COD;
  const today = new Date().toISOString().split('T')[0];

  const [lobbyRows, setLobbyRows] = useState(() =>
    groups.map((g) => ({
      group_name: g.group_name,
      matches: g.matches || [],
      teams: g.teams || [],
      time: '19:00',
      date: today,
      map: gameMaps[0],
    }))
  );

  // Re-init when groups change (e.g. round change)
  useEffect(() => {
    setLobbyRows(
      groups.map((g) => ({
        group_name: g.group_name,
        matches: g.matches || [],
        teams: g.teams || [],
        time: '19:00',
        date: today,
        map: gameMaps[0],
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups]);

  const handleChange = (idx, field, val) => {
    setLobbyRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: val } : r)));
  };

  const handleApply = async () => {
    const schedule = lobbyRows.flatMap((row) =>
      row.matches.map((match) => ({
        match_id: match.id,
        match_number: match.match_number,
        group_name: row.group_name,
        scheduled_date: row.date,
        scheduled_time: row.time,
        map_name: row.map === 'other' ? 'Custom Map' : row.map,
      }))
    );
    if (schedule.length === 0) return;
    setLoading(true);
    try {
      const response = await tournamentAPI.bulkSchedule(tournament.id, schedule);
      onSuccess?.(response.data);
      onClose();
    } catch (error) {
      console.error('Error applying bulk schedule:', error);
      alert('Failed to apply schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bsm-5v5-subtitle">Set match times for all lobbies — Round {currentRound}</div>

      {groups.length === 0 ? (
        <p className="empty-state">No lobbies configured for this round</p>
      ) : (
        <div className="bsm-lobby-list">
          {lobbyRows.map((row, idx) => (
            <LobbyRow
              key={row.group_name}
              lobby={row}
              lobbyIndex={idx}
              gameMaps={gameMaps}
              onChange={handleChange}
            />
          ))}
        </div>
      )}

      <div className="bulk-schedule-footer">
        <button type="button" className="cancel-btn" onClick={onClose} disabled={loading}>
          Cancel
        </button>
        <button
          type="button"
          className="apply-btn"
          onClick={handleApply}
          disabled={loading || groups.length === 0}
        >
          {loading ? (
            <>
              <div className="spinner" />
              Applying...
            </>
          ) : (
            <>
              <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Apply Schedule
            </>
          )}
        </button>
      </div>
    </>
  );
};

/* ── Main Modal ────────────────────────────────────────────────────────────── */
const BulkScheduleModal = ({ isOpen, onClose, tournament, onSuccess, defaultRound }) => {
  const is5v5 = !!tournament?.is_5v5;

  // ── Standard (non-5v5) state ────────────────────────────────────────────────
  const [selectedRound, setSelectedRound] = useState(1);
  const [groups, setGroups] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [selectedMatches, setSelectedMatches] = useState([]);
  const [date, setDate] = useState('');
  const [matchTimes, setMatchTimes] = useState({});
  const [mapPreset, setMapPreset] = useState('default');
  const [customMapName, setCustomMapName] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState([]);

  const gameMaps = MAP_PRESETS[tournament?.game_name] || MAP_PRESETS.BGMI;

  const roundOptions =
    tournament?.rounds?.map((r) => ({
      value: r.round,
      label: `Round ${r.round}`,
    })) || [];

  const mapOptions = [
    { value: 'default', label: 'Default Presets' },
    ...gameMaps.map((m) => ({ value: m, label: m })),
    { value: 'other', label: 'Other (custom)' },
  ];

  const currentRound =
    defaultRound || (tournament?.current_round > 0 ? tournament.current_round : 1);

  useEffect(() => {
    if (isOpen && tournament) {
      const round = defaultRound || currentRound;
      setSelectedRound(round);
      setDate(new Date().toISOString().split('T')[0]);
      fetchGroups(round);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tournament]);

  const fetchGroups = async (roundNumber) => {
    try {
      const response = await tournamentAPI.getRoundGroups(tournament.id, roundNumber);
      setGroups(response.data.groups || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setGroups([]);
    }
  };

  const handleRoundChange = (roundNum) => {
    setSelectedRound(roundNum);
    setSelectedGroups([]);
    setSelectedMatches([]);
    setMatchTimes({});
    fetchGroups(roundNum);
  };

  const toggleGroup = (groupName) => {
    if (selectedGroups.includes(groupName)) {
      setSelectedGroups(selectedGroups.filter((g) => g !== groupName));
      const groupMatches =
        groups.find((g) => g.group_name === groupName)?.matches?.map((m) => m.id) || [];
      setSelectedMatches(selectedMatches.filter((m) => !groupMatches.includes(m)));
    } else {
      setSelectedGroups([...selectedGroups, groupName]);
    }
  };

  const selectAllGroups = () => setSelectedGroups(groups.map((g) => g.group_name));
  const deselectAllGroups = () => {
    setSelectedGroups([]);
    setSelectedMatches([]);
    setMatchTimes({});
  };

  const getAvailableMatches = () => {
    if (selectedGroups.length === 0) return [];
    return groups
      .filter((g) => selectedGroups.includes(g.group_name))
      .flatMap((g) => g.matches || []);
  };

  const toggleMatch = (matchIdsForNum, allSelected) => {
    if (allSelected) {
      setSelectedMatches((prev) => prev.filter((id) => !matchIdsForNum.includes(id)));
      setMatchTimes((prev) => {
        const t = { ...prev };
        matchIdsForNum.forEach((id) => delete t[id]);
        return t;
      });
    } else {
      setSelectedMatches((prev) => [...new Set([...prev, ...matchIdsForNum])]);
    }
  };

  const selectAllMatches = () => setSelectedMatches(getAvailableMatches().map((m) => m.id));
  const deselectAllMatches = () => {
    setSelectedMatches([]);
    setMatchTimes({});
  };

  const handleTimeChange = (matchId, time) => setMatchTimes({ ...matchTimes, [matchId]: time });

  const getMatchNumber = (match) => match.match_number;

  const getMapForMatch = (matchIndex) => {
    if (mapPreset === 'other') return customMapName.trim() || 'Custom Map';
    if (mapPreset === 'default') return gameMaps[matchIndex % gameMaps.length];
    return mapPreset;
  };

  useEffect(() => {
    if (selectedMatches.length > 0 && date) {
      const allAvailable = getAvailableMatches();
      const matches = allAvailable.filter((m) => selectedMatches.includes(m.id));
      const timeByMatchNumber = {};
      const selectedAvailable = allAvailable.filter((m) => selectedMatches.includes(m.id));
      const uniqueNums = [...new Set(selectedAvailable.map((m) => getMatchNumber(m)))];
      uniqueNums.forEach((num) => {
        const rep = selectedAvailable.find((m) => getMatchNumber(m) === num);
        if (rep && matchTimes[rep.id]) timeByMatchNumber[num] = matchTimes[rep.id];
      });
      setPreview(
        matches.map((match) => {
          const matchNum = getMatchNumber(match);
          const time = timeByMatchNumber[matchNum] || matchTimes[match.id] || '19:00';
          const map = getMapForMatch(matchNum - 1);
          const group = groups.find((g) => g.matches?.some((m) => m.id === match.id));
          return {
            match_id: match.id,
            match_number: matchNum,
            group_name: group?.group_name,
            scheduled_date: date,
            scheduled_time: time,
            map_name: map,
          };
        })
      );
    } else {
      setPreview([]);
    }
  }, [selectedMatches, date, matchTimes, mapPreset, customMapName]);

  const handleApplySchedule = async () => {
    if (preview.length === 0) return;
    setLoading(true);
    try {
      const response = await tournamentAPI.bulkSchedule(tournament.id, preview);
      onSuccess?.(response.data);
      onClose();
    } catch (error) {
      console.error('Error applying bulk schedule:', error);
      alert('Failed to apply schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const availableMatches = getAvailableMatches();
  const uniqueMatchNumbers = [...new Set(availableMatches.map((m) => getMatchNumber(m)))].sort(
    (a, b) => a - b
  );

  return (
    <div className="bulk-schedule-modal-overlay" onClick={onClose}>
      <div className="bulk-schedule-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bulk-schedule-header">
          <div className="bulk-schedule-title">
            <svg className="bulk-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
              />
            </svg>
            Bulk Schedule
          </div>
          <button className="close-btn" onClick={onClose} type="button">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="bulk-schedule-body">
          {/* ── 5v5 simplified per-lobby view ── */}
          {is5v5 ? (
            <BulkSchedule5v5
              tournament={tournament}
              currentRound={currentRound}
              groups={groups}
              onClose={onClose}
              onSuccess={onSuccess}
              loading={loading}
              setLoading={setLoading}
            />
          ) : (
            <>
              {/* Round */}
              <div className="schedule-section">
                <label className="section-label">
                  <svg className="label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  Round
                </label>
                <CustomSelect
                  value={selectedRound}
                  onChange={(v) => handleRoundChange(Number(v))}
                  options={roundOptions}
                  placeholder="Select round"
                />
              </div>

              {/* Groups */}
              <div className="schedule-section-lg">
                <div className="section-header">
                  <label className="section-label">
                    <svg
                      className="label-icon"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    Groups
                  </label>
                  <div className="toggle-buttons">
                    <button type="button" className="toggle-btn" onClick={selectAllGroups}>
                      All
                    </button>
                    <button type="button" className="toggle-btn" onClick={deselectAllGroups}>
                      None
                    </button>
                  </div>
                </div>
                <div className="group-buttons">
                  {groups.map((group) => (
                    <button
                      key={group.group_name}
                      type="button"
                      className={`group-btn${selectedGroups.includes(group.group_name) ? ' selected' : ''}`}
                      onClick={() => toggleGroup(group.group_name)}
                    >
                      {group.group_name}
                    </button>
                  ))}
                  {groups.length === 0 && (
                    <p className="empty-state">No groups configured for this round</p>
                  )}
                </div>
                <p className="selection-info">{selectedGroups.length} groups selected</p>
              </div>

              {/* Matches */}
              {selectedGroups.length > 0 && (
                <div className="schedule-section-lg">
                  <div className="section-header">
                    <label className="section-label">
                      <svg
                        className="label-icon"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                        />
                      </svg>
                      Matches
                    </label>
                    <div className="toggle-buttons">
                      <button type="button" className="toggle-btn" onClick={selectAllMatches}>
                        All
                      </button>
                      <button type="button" className="toggle-btn" onClick={deselectAllMatches}>
                        None
                      </button>
                    </div>
                  </div>
                  <div className="match-buttons">
                    {uniqueMatchNumbers.map((matchNum) => {
                      const matchIdsForNum = availableMatches
                        .filter((m) => getMatchNumber(m) === matchNum)
                        .map((m) => m.id);
                      const allSelected =
                        matchIdsForNum.length > 0 &&
                        matchIdsForNum.every((id) => selectedMatches.includes(id));
                      return (
                        <button
                          key={matchNum}
                          type="button"
                          className={`match-btn${allSelected ? ' selected' : ''}`}
                          onClick={() => toggleMatch(matchIdsForNum, allSelected)}
                        >
                          M{matchNum}
                        </button>
                      );
                    })}
                  </div>
                  <p className="selection-info">
                    {selectedMatches.length} × {selectedGroups.length} = {selectedMatches.length}{' '}
                    schedules
                  </p>
                </div>
              )}

              {/* Date */}
              {selectedMatches.length > 0 && (
                <div className="schedule-section">
                  <label className="section-label">
                    <svg
                      className="label-icon"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Date <span className="section-label-required">*</span>
                  </label>
                  <input
                    type="date"
                    className="date-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              )}

              {/* Match Times */}
              {selectedMatches.length > 0 && date && (
                <div className="schedule-section-lg">
                  <label className="section-label">
                    <svg
                      className="label-icon"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Match Times <span className="section-label-required">*</span>
                  </label>
                  <div className="match-times-grid">
                    {uniqueMatchNumbers.map((matchNum) => {
                      const match = availableMatches.find(
                        (m) => getMatchNumber(m) === matchNum && selectedMatches.includes(m.id)
                      );
                      const isActive = availableMatches
                        .filter((m) => getMatchNumber(m) === matchNum)
                        .some((m) => selectedMatches.includes(m.id));
                      return (
                        <div
                          key={matchNum}
                          className={`time-input-group${isActive ? ' active' : ' inactive'}`}
                        >
                          <label className="time-label">M{matchNum}</label>
                          <input
                            type="time"
                            className="time-input"
                            value={match ? matchTimes[match.id] || '19:00' : ''}
                            onChange={(e) => match && handleTimeChange(match.id, e.target.value)}
                            disabled={!isActive}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Map Assignment */}
              {selectedMatches.length > 0 && (
                <div className="schedule-section">
                  <label className="section-label">
                    <svg
                      className="label-icon"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                      />
                    </svg>
                    Map Assignment
                  </label>
                  <CustomSelect
                    value={mapPreset}
                    onChange={(v) => setMapPreset(v)}
                    options={mapOptions}
                    placeholder="Select map"
                  />
                  {mapPreset === 'other' && (
                    <input
                      type="text"
                      className="map-custom-input"
                      placeholder="Enter map name..."
                      value={customMapName}
                      onChange={(e) => setCustomMapName(e.target.value)}
                    />
                  )}
                  <p className="map-preset-info">
                    Default: M1={gameMaps[0]}, M2={gameMaps[1 % gameMaps.length]}, M3=
                    {gameMaps[2 % gameMaps.length]}, M4={gameMaps[3 % gameMaps.length]}
                  </p>
                </div>
              )}

              {/* Preview */}
              {preview.length > 0 && (
                <div className="preview-section">
                  <p className="preview-title">Preview:</p>
                  <p className="preview-round-line">
                    Round {selectedRound} → {selectedGroups.length}G ×{' '}
                    {Math.ceil(preview.length / selectedGroups.length)}M
                  </p>
                  <div className="preview-box">
                    {[...new Set(preview.map((p) => p.match_number))]
                      .sort((a, b) => a - b)
                      .map((matchNum) => {
                        const item = preview.find((p) => p.match_number === matchNum);
                        return (
                          <div key={matchNum} className="preview-item">
                            <span className="preview-item-match">M{matchNum}:</span>
                            <span className="preview-item-date">
                              {new Date(item.scheduled_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                            <span className="preview-item-time">{item.scheduled_time}</span>
                            <span>• {item.map_name}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="bulk-schedule-footer">
                <button type="button" className="cancel-btn" onClick={onClose} disabled={loading}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="apply-btn"
                  onClick={handleApplySchedule}
                  disabled={loading || preview.length === 0}
                >
                  {loading ? (
                    <>
                      <div className="spinner" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <svg
                        className="btn-icon"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Apply Schedule
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkScheduleModal;
