import React, { useState, useEffect } from 'react';
import { tournamentAPI } from '../utils/api';
import './BulkScheduleModal.css';

const MAP_PRESETS = {
  BGMI: ['Erangel', 'Miramar', 'Vikendi', 'Sanhok', 'Livik', 'Karakin'],
  COD: ['Standoff', 'Crossfire', 'Crash', 'Nuketown', 'Raid', 'Summit'],
  Valorant: ['Ascent', 'Bind', 'Haven', 'Split', 'Icebox', 'Breeze', 'Fracture', 'Pearl'],
  Freefire: ['Bermuda', 'Purgatory', 'Kalahari', 'Alpine'],
  Scarfall: ['Map 1', 'Map 2', 'Map 3'],
};

const BulkScheduleModal = ({ isOpen, onClose, tournament, onSuccess }) => {
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

  useEffect(() => {
    if (isOpen && tournament) {
      // Set default round to current or first round
      const defaultRound = tournament.current_round > 0 ? tournament.current_round : 1;
      setSelectedRound(defaultRound);
      setDate(new Date().toISOString().split('T')[0]);
      fetchGroups(defaultRound);
    }
  }, [isOpen, tournament]);

  <select className="map-select" value={mapPreset} onChange={(e) => setMapPreset(e.target.value)}>
    <option value="default">Default Presets</option>
    {gameMaps.map((m) => (
      <option key={m} value={m}>
        {m}
      </option>
    ))}
  </select>;
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
      // Deselect all matches from this group
      const groupMatches =
        groups.find((g) => g.group_name === groupName)?.matches?.map((m) => m.id) || [];
      setSelectedMatches(selectedMatches.filter((m) => !groupMatches.includes(m)));
    } else {
      setSelectedGroups([...selectedGroups, groupName]);
    }
  };

  const selectAllGroups = () => {
    setSelectedGroups(groups.map((g) => g.group_name));
  };

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

  const toggleMatch = (matchId) => {
    setSelectedMatches((prev) => {
      if (prev.includes(matchId)) {
        return prev.filter((m) => m !== matchId);
      } else {
        return [...prev, matchId];
      }
    });
    // Clean up matchTimes if deselecting
    setMatchTimes((prev) => {
      const newTimes = { ...prev };
      delete newTimes[matchId];
      return newTimes;
    });
  };

  const selectAllMatches = () => {
    const allMatches = getAvailableMatches().map((m) => m.id);
    setSelectedMatches(allMatches);
  };

  const deselectAllMatches = () => {
    setSelectedMatches([]);
    setMatchTimes({});
  };

  const handleTimeChange = (matchId, time) => {
    setMatchTimes({ ...matchTimes, [matchId]: time });
  };

  const getMatchNumber = (match) => {
    return match.match_number;
  };

  const getMapForMatch = (matchIndex) => {
    if (mapPreset === 'other') {
      return customMapName.trim() || 'Custom Map';
    }
    if (mapPreset === 'default') {
      return gameMaps[matchIndex % gameMaps.length];
    }
    // Specific map selected — use for all matches
    return mapPreset;
  };

  useEffect(() => {
    // Generate preview whenever selections change
    if (selectedMatches.length > 0 && date) {
      const allAvailable = getAvailableMatches();
      const matches = allAvailable.filter((m) => selectedMatches.includes(m.id));

      // Build a time lookup by match_number so that the time set in the UI
      // (which tracks only the first match per number) applies to ALL matches
      // with that match_number across every group.
      const timeByMatchNumber = {};
      const selectedAvailable = allAvailable.filter((m) => selectedMatches.includes(m.id));
      const uniqueNums = [...new Set(selectedAvailable.map((m) => getMatchNumber(m)))];
      uniqueNums.forEach((num) => {
        const representative = selectedAvailable.find((m) => getMatchNumber(m) === num);
        if (representative && matchTimes[representative.id]) {
          timeByMatchNumber[num] = matchTimes[representative.id];
        }
      });

      const previewData = matches.map((match) => {
        const matchNum = getMatchNumber(match);
        const time = timeByMatchNumber[matchNum] || matchTimes[match.id] || '19:00';
        // Use match_number-based index for map assignment so every Match N gets the same map
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
      });
      setPreview(previewData);
    } else {
      setPreview([]);
    }
  }, [selectedMatches, date, matchTimes, mapPreset, customMapName]);

  const handleApplySchedule = async () => {
    if (preview.length === 0) {
      return;
    }

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
            <span>Bulk Schedule</span>
          </div>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="bulk-schedule-body">
          {/* Round Selector */}
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
            <select
              className="round-select"
              value={selectedRound}
              onChange={(e) => handleRoundChange(Number(e.target.value))}
            >
              {tournament?.rounds?.map((round) => (
                <option key={round.round} value={round.round}>
                  Round {round.round}
                </option>
              ))}
            </select>
          </div>

          {/* Groups Selection */}
          <div className="schedule-section">
            <div className="section-header">
              <label className="section-label">
                <svg className="label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <button className="toggle-btn" onClick={selectAllGroups}>
                  All
                </button>
                <button className="toggle-btn" onClick={deselectAllGroups}>
                  None
                </button>
              </div>
            </div>
            <div className="group-buttons">
              {groups.map((group) => (
                <button
                  key={group.group_name}
                  className={`group-btn ${selectedGroups.includes(group.group_name) ? 'selected' : ''}`}
                  onClick={() => toggleGroup(group.group_name)}
                >
                  {group.group_name}
                </button>
              ))}
              {groups.length === 0 && (
                <p className="empty-state">No groups configured for this round</p>
              )}
            </div>
            {selectedGroups.length > 0 && (
              <p className="selection-info">{selectedGroups.length} groups selected</p>
            )}
          </div>

          {/* Matches Selection */}
          {selectedGroups.length > 0 && (
            <div className="schedule-section">
              <div className="section-header">
                <label className="section-label">
                  <svg className="label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <button className="toggle-btn" onClick={selectAllMatches}>
                    All
                  </button>
                  <button className="toggle-btn" onClick={deselectAllMatches}>
                    None
                  </button>
                </div>
              </div>
              <div className="match-buttons">
                {uniqueMatchNumbers.map((matchNum) => {
                  const matchIdsForNum = availableMatches
                    .filter((m) => getMatchNumber(m) === matchNum)
                    .map((m) => m.id);
                  const allSelected = matchIdsForNum.every((id) => selectedMatches.includes(id));
                  return (
                    <button
                      key={matchNum}
                      className={`match-btn ${allSelected && matchIdsForNum.length > 0 ? 'selected' : ''}`}
                      onClick={() => {
                        if (allSelected) {
                          // Deselect all matches with this number
                          setSelectedMatches((prev) =>
                            prev.filter((id) => !matchIdsForNum.includes(id))
                          );
                          setMatchTimes((prev) => {
                            const newTimes = { ...prev };
                            matchIdsForNum.forEach((id) => delete newTimes[id]);
                            return newTimes;
                          });
                        } else {
                          // Select all matches with this number
                          setSelectedMatches((prev) => [...new Set([...prev, ...matchIdsForNum])]);
                        }
                      }}
                    >
                      M{matchNum}
                    </button>
                  );
                })}
              </div>
              <p className="selection-info">
                {selectedGroups.length} ×{' '}
                {selectedMatches.length > 0
                  ? Math.ceil(selectedMatches.length / selectedGroups.length)
                  : 0}{' '}
                = {selectedMatches.length} schedules
              </p>
            </div>
          )}

          {/* Date */}
          {selectedMatches.length > 0 && (
            <div className="schedule-section">
              <label className="section-label required">
                <svg className="label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Date
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
            <div className="schedule-section">
              <label className="section-label required">
                <svg className="label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Match Times
              </label>
              <div className="match-times-grid">
                {uniqueMatchNumbers
                  .filter((matchNum) =>
                    availableMatches.some(
                      (m) => getMatchNumber(m) === matchNum && selectedMatches.includes(m.id)
                    )
                  )
                  .map((matchNum) => {
                    const match = availableMatches.find(
                      (m) => getMatchNumber(m) === matchNum && selectedMatches.includes(m.id)
                    );
                    return (
                      <div key={matchNum} className="time-input-group">
                        <label className="time-label">M{matchNum}</label>
                        <input
                          type="time"
                          className="time-input"
                          value={matchTimes[match.id] || '19:00'}
                          onChange={(e) => handleTimeChange(match.id, e.target.value)}
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
                <svg className="label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
                Map Assignment
              </label>
              <select
                className="map-select"
                value={mapPreset}
                onChange={(e) => setMapPreset(e.target.value)}
              >
                <option value="default">Default Presets</option>
                {gameMaps &&
                  gameMaps.length > 0 &&
                  gameMaps.map((map) => (
                    <option key={map} value={map}>
                      {map}
                    </option>
                  ))}
                <option value="other">Other (custom)</option>
              </select>
              {mapPreset === 'other' && (
                <input
                  type="text"
                  className="map-custom-input"
                  placeholder="Enter map name..."
                  value={customMapName}
                  onChange={(e) => setCustomMapName(e.target.value)}
                  style={{
                    marginTop: '8px',
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              )}
              <p className="map-preset-info">
                Default: M1→{gameMaps[0]}, M2→{gameMaps[1 % gameMaps.length]}, M3→
                {gameMaps[2 % gameMaps.length]}, M4→{gameMaps[3 % gameMaps.length]}
              </p>
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && (
            <div className="schedule-section preview-section">
              <label className="section-label">
                <svg className="label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                Preview
              </label>
              <div className="preview-box">
                <p className="preview-title">
                  Round {selectedRound} = {selectedGroups.length} ×{' '}
                  {Math.ceil(preview.length / selectedGroups.length)}M
                </p>
                {preview.map((item, idx) => (
                  <div key={idx} className="preview-item">
                    M{item.match_number}:{' '}
                    {new Date(item.scheduled_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    {item.scheduled_time} • {item.map_name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bulk-schedule-footer">
          <button className="cancel-btn" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="apply-btn"
            onClick={handleApplySchedule}
            disabled={loading || preview.length === 0}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
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
      </div>
    </div>
  );
};

export default BulkScheduleModal;
