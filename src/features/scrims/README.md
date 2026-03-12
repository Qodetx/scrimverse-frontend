# scrims feature

All scrim-related code in one place.

## Structure

```
scrims/
├── ui/               # Reusable scrim UI components
│   ├── ScrimCard.js          - Card shown in scrim listings
│   └── ScrimConfigModal.js   - Scrim configuration modal (borrows RoundConfigModal.css from tournaments)
└── routes/           # Scrim pages (React Router routes)
    ├── ScrimsPage.js         - /scrims listing (reuses TournamentsPage.css)
    ├── ScrimDetail.js        - /scrims/:id
    ├── CreateScrim.js        - /host/create-scrim
    └── ManageScrim.js        - Scrim management (navigated from ScrimDetail)
```

## Import paths

From within `ui/` or `routes/`:
- Shared utils: `../../../utils/api`
- Auth context: `../../../context/AuthContext`
- Custom hooks: `../../../hooks/useToast`
- Shared components: `../../../components/Toast`
- Tournament UI (shared): `../../tournaments/ui/GroupManagementView`
- Tournament CSS (reused): `../../tournaments/routes/TournamentsPage.css`
- Intra-feature: `../ui/ScrimConfigModal` (from routes)

## Cross-feature dependencies
- `ScrimsPage` uses `TournamentCard` from `../../tournaments/ui/` (scrims are stored as tournaments)
- `ScrimDetail` uses `RegistrationModal` from `../../tournaments/ui/`
- `ManageScrim` uses several tournament UI modals (GroupManagementView, MatchConfigModal, etc.)
- `ScrimConfigModal` reuses `RoundConfigModal.css` from `../../tournaments/ui/`
