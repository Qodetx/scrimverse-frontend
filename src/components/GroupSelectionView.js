import React from 'react';
import './GroupSelectionView.css';

const GroupSelectionView = ({ groups, onGroupSelect }) => {
  if (!groups || groups.length === 0) {
    return (
      <div className="no-groups">
        <p>No groups configured for this round yet.</p>
      </div>
    );
  }

  return (
    <div className="group-selection-view">
      <div className="groups-grid">
        {groups.map((group) => (
          <div key={group.id} className="group-card" onClick={() => onGroupSelect(group)}>
            <div className="group-header">
              <h3>{group.group_name}</h3>
            </div>
            <div className="group-body">
              <div className="group-stat">
                <span className="stat-label">Teams:</span>
                <span className="stat-value">{group.teams_count}</span>
              </div>
              <div className="group-stat">
                <span className="stat-label">Matches:</span>
                <span className="stat-value">
                  {group.completed_matches || 0} / {group.total_matches || 0}
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${
                      group.total_matches
                        ? (group.completed_matches / group.total_matches) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
            <div className="group-footer">
              <button className="btn-manage">Manage Group →</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupSelectionView;
