# tournaments feature

All tournament-related code in one place.

## Structure

```
tournaments/
├── ui/               # Reusable tournament UI components
│   ├── TournamentCard.js           - Card shown in listings
│   ├── PlayerTournamentCard.js     - Card for player's registered tournaments
│   ├── RegistrationModal.js        - Registration flow modal
│   ├── TournamentPlanSelector.js   - Plan selection (basic/featured/premium)
│   ├── TournamentPlanModal.js      - Plan details modal
│   ├── CompactPlanSelector.js      - Compact plan selector for scrims
│   ├── PointsTableModal.js         - Points table display
│   ├── ScrimPointsTableModal.js    - Scrim-specific points table
│   ├── GroupManagementView.js      - Group/bracket management
│   ├── GroupSelectionView.js       - Group selection UI
│   ├── MatchConfigModal.js         - Match room ID/password config
│   ├── MatchPointsModal.js         - Match score entry
│   ├── BulkScheduleModal.js        - Bulk match scheduling
│   ├── RoundConfigModal.js         - Round configuration
│   ├── RoundNamesModal.js          - Round naming
│   ├── EliminatedTeamsModal.js     - Eliminated teams display
│   ├── TeamPlayersModal.js         - Team player list
│   ├── Lobby5v5PreviewModal.js     - 5v5 lobby preview
│   └── standingsImageGenerator.js  - Export standings as image
└── routes/           # Tournament pages (React Router routes)
    ├── TournamentsPage.js          - /tournaments listing
    ├── TournamentDetail.js         - /tournaments/:id
    ├── ManageTournament.js         - /tournaments/:id/manage
    ├── TournamentStats.js          - /tournaments/:id/stats
    ├── CreateTournament.js         - /host/create-tournament
    ├── VerifiedTournaments.js      - Verified tournaments list
    └── InstantRegistration.js      - Instant registration flow
```

## Import paths

From within `ui/` or `routes/`:
- Shared utils: `../../../utils/api`
- Auth context: `../../../context/AuthContext`
- Custom hooks: `../../../hooks/useToast`
- Shared components: `../../../components/Toast`
- Intra-feature: `../ui/TournamentCard` (from routes), `./PointsTableModal` (within ui)

From `pages/` or `components/` (outside):
- `../features/tournaments/ui/TournamentCard`
- `../features/tournaments/routes/TournamentsPage`
