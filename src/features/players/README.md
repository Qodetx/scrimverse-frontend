# players feature

All player-facing code in one place.

## Structure

```
players/
├── ui/                           # Player UI components
│   └── EditPlayerProfileModal.js  - Modal for editing player profile
└── routes/                       # Player pages (React Router routes)
    ├── PlayerDashboard.js         - /player/dashboard
    ├── PlayerProfile.js           - /player/profile/:id
    ├── PlayerSearchPage.js        - /player-search
    └── PlayerGuidelines.js        - Player guidelines page
```

## Import paths

From within `ui/` or `routes/`:
- API: `../../../utils/api`
- Auth context: `../../../context/AuthContext`
- Hooks: `../../../hooks/useToast`, `../../../hooks/use-mobile`
- Shared components: `../../../components/Toast`, `../../../components/Footer`
- Intra-feature: `../ui/EditPlayerProfileModal` (from routes)
- Cross-feature: `../../tournaments/ui/PlayerTournamentCard`, `../../teams/ui/TeamManagementModal`

## Cross-feature consumers
- `components/Navbar.js` imports `EditPlayerProfileModal` from `../features/players/ui/`
