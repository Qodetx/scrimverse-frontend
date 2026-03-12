# teams feature

All team management related code in one place.

## Structure

```
teams/
├── ui/                       # Team UI components
│   ├── AddPlayersModal.js    - Add players to team modal
│   ├── EditTeamModal.js      - Edit team details modal
│   ├── JoinRequestsModal.js  - View/manage join requests modal
│   ├── TeamDetailsModal.js   - View team details (used in tournament context)
│   └── TeamManagementModal.js - Full team management modal (used in PlayerDashboard)
└── routes/                   # Team pages (React Router routes)
    ├── CreateTeam.js          - /player/create-team
    ├── TeamDashboard.js       - /player/team/dashboard + /player/team/dashboard/:teamId
    ├── TeamProfile.js         - /team/:id
    └── JoinTeam.js            - /join-team/:token
```

## Import paths

From within `ui/` or `routes/`:
- API: `../../../utils/api`
- Auth context: `../../../context/AuthContext`
- Hooks: `../../../hooks/useToast`
- Shared components: `../../../components/Toast`, `../../../components/ConfirmModal`
- Tournament UI (cross-feature): `../../tournaments/ui/RoundConfigModal.css` (TeamDetailsModal)
- Intra-feature: `../ui/EditTeamModal` (from routes)

## Cross-feature consumers
- `pages/PlayerDashboard.js` imports `TeamManagementModal` from `../features/teams/ui/`
