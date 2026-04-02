import React from 'react';
import { createPortal } from 'react-dom';

const ScrimResultsModal = ({ isOpen, onClose, results = [], scrimName }) => {
  if (!isOpen) return null;

  const getRankDisplay = (index) => {
    if (index === 0) return <span style={{ fontSize: '1.25rem' }}>🥇</span>;
    if (index === 1) return <span style={{ fontSize: '1.25rem' }}>🥈</span>;
    if (index === 2) return <span style={{ fontSize: '1.25rem' }}>🥉</span>;
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
          borderRadius: '1rem',
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
            padding: '1.5rem 2rem',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🏆</span>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                }}
              >
                {scrimName} — Final Results
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              width: '2.5rem',
              height: '2.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '0.75rem',
              fontSize: '1.125rem',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          >
            ✕
          </button>
        </div>

        {/* Scrollable table body */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#111111' }}>
                {['Rank', 'Team Name', 'Matches', 'Placement', 'Kills', 'Total'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '1rem 1.5rem',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: '#666666',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
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
                    background:
                      index === 0
                        ? 'rgba(255,215,0,0.03)'
                        : index === 1
                          ? 'rgba(192,192,192,0.03)'
                          : index === 2
                            ? 'rgba(205,127,50,0.03)'
                            : 'transparent',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    transition: 'background 0.2s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background =
                      index === 0
                        ? 'rgba(255,215,0,0.03)'
                        : index === 1
                          ? 'rgba(192,192,192,0.03)'
                          : index === 2
                            ? 'rgba(205,127,50,0.03)'
                            : 'transparent')
                  }
                >
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                    {getRankDisplay(index)}
                  </td>
                  <td
                    style={{
                      padding: '1rem 1.5rem',
                      fontWeight: 700,
                      color: '#ffffff',
                      fontSize: '0.9375rem',
                    }}
                  >
                    {team.team_name}
                  </td>
                  <td
                    style={{
                      padding: '1rem 1.5rem',
                      textAlign: 'center',
                      color: '#888888',
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                    }}
                  >
                    {team.matches_played || team.matches || 0}
                  </td>
                  <td
                    style={{
                      padding: '1rem 1.5rem',
                      textAlign: 'center',
                      color: '#ffffff',
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                    }}
                  >
                    {team.position_points || 0}
                  </td>
                  <td
                    style={{
                      padding: '1rem 1.5rem',
                      textAlign: 'center',
                      color: '#ffffff',
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                    }}
                  >
                    {team.kill_points || team.total_kills || 0}
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                    <span
                      style={{
                        fontSize: '1rem',
                        fontWeight: 900,
                        color: '#8b5cf6', // Lovable Purple
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
