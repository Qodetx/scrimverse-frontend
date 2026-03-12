# hosts feature

All host-facing code in one place.

## Structure

```
hosts/
├── ui/                          # Host UI components
│   └── EditHostProfileModal.js  - Modal for editing host profile
└── routes/                      # Host pages (React Router routes)
    ├── HostDashboard.js          - /host/dashboard
    └── HostProfile.js            - /host/profile/:id
```

## Import paths

From within `ui/` or `routes/`:
- API: `../../../utils/api`
- Auth context: `../../../context/AuthContext`
- Hooks: `../../../hooks/use-mobile`
- Intra-feature: `../ui/EditHostProfileModal` (from routes)

## Cross-feature consumers
- `components/Navbar.js` imports `EditHostProfileModal` from `../features/hosts/ui/`
- Route guards (`HostOnlyRoute`) in `App.js` wrap these routes
