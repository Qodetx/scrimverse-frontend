import React from 'react';
import { createPortal } from 'react-dom';

const ScrimResultsModal = ({ isOpen, onClose, results = [], scrimName }) => {
  if (!isOpen) return null;

  const getRankDisplay = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return index + 1;
  };

  const content = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#111111',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '0.75rem',
          boxShadow: '0 25px 60px rgba(0,0,0,0.9)',
          width: '95vw',
          maxWidth: '800px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🏆</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#f0f0f0' }}>
                {scrimName} — Final Results
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              width: '2rem',
              height: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '0.375rem',
              fontSize: '1rem',
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable table body */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1a1a1a' }}>
                {['Rank', 'Team Name', 'Matches', 'Placement', 'Kills', 'Total'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '0.625rem 1rem',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: '#888',
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      textAlign: h === 'Team Name' ? 'left' : 'center',
                      borderBottom: '1px solid rgba(255,255,255,0.08)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((team, index) => (
                <tr
                  key={team.team_id || index}
                  style={{
                    background: index < 3 ? 'rgba(139,92,246,0.04)' : 'transparent',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '1rem' }}>
                    {getRankDisplay(index)}
                  </td>
                  <td
                    style={{
                      padding: '0.75rem 1rem',
                      fontWeight: 600,
                      color: '#f0f0f0',
                      fontSize: '0.875rem',
                    }}
                  >
                    {team.team_name}
                  </td>
                  <td
                    style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'center',
                      color: '#aaa',
                      fontSize: '0.875rem',
                    }}
                  >
                    {team.matches_played || '—'}
                  </td>
                  <td
                    style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'center',
                      color: '#aaa',
                      fontSize: '0.875rem',
                    }}
                  >
                    {team.position_points || 0}
                  </td>
                  <td
                    style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'center',
                      color: '#aaa',
                      fontSize: '0.875rem',
                    }}
                  >
                    {team.kill_points || team.total_kills || 0}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '2.5rem',
                        padding: '0.2rem 0.5rem',
                        background: 'rgba(139,92,246,0.15)',
                        border: '1px solid rgba(139,92,246,0.3)',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        color: '#a78bfa',
                      }}
                    >
                      {team.total_points || 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            justifyContent: 'flex-end',
            flexShrink: 0,
            background: '#111111',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1.25rem',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '0.5rem',
              color: '#d0d0d0',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default ScrimResultsModal;
