# 🎯 QUICK REFERENCE - HOST SIDE E2E TESTING

## 📊 YOUR TEST TOURNAMENTS
```
Tournament 1: VALORANT 5V5 - E2E TEST TOURNAMENT 1
├─ Teams: 7
├─ Status: LIVE / Round 0
├─ Recommended: Start here (manageable size)
└─ Action: Test now ➜

Tournament 2: BGMI SQUAD - E2E TEST TOURNAMENT 2
├─ Teams: 6
├─ Status: LIVE / Round 0
├─ Recommended: Test after Phase 1 works
└─ Action: Test later ➜

Tournament 3: CALL OF DUTY SQUAD - E2E TEST TOURNAMENT 3
├─ Teams: 4
├─ Status: LIVE / Round 0
├─ Recommended: Quick validation after main tests
└─ Action: Test last ➜
```

---

## 🧪 CURRENT PHASE: PHASE 1 - ROUND CONFIGURATION

### Your Next Actions (In Order):
1. ✅ **Open VALORANT Tournament page**
   - URL: `localhost:3000/host/tournaments/[tournament-id]/manage`
   
2. ✅ **Scroll to Round 1 section**
   - Look for "Configure Round" button
   
3. ✅ **Create 2 Groups:**
   - Group A: Teams 1,2,3,4 (4 teams)
   - Group B: Teams 5,6,7 (3 teams)
   
4. ✅ **Submit Configuration**
   - Click Save/Submit button
   
5. ✅ **Verify Data Persists**
   - Navigate away and back
   - Check DevTools Network tab

---

## 🐛 DEBUGGING CHECKLIST (If Something Fails)

### If Round Configuration Modal Won't Open:
```
❌ Modal button not visible?
   → Scroll down - it's further down the page
   
❌ Modal opens but is blank?
   → Check Browser Console (F12 → Console tab)
   → Look for error messages
   → Check Network tab for failed API calls
   
❌ Button is grayed out/disabled?
   → Tournament must not be in "completed" status
   → Check current_round = 0
   → Check tournament status is "live"
```

### If Groups Won't Save:
```
❌ "Save" button does nothing?
   → Check if API endpoint is running: curl http://localhost:8000/api/
   → Check Python backend console for errors
   
❌ Modal closes but groups disappear?
   → CRITICAL BUG - database not saving
   → Check Django models for validation errors
   → Check Django logs in terminal
   
❌ Error message appears?
   → Note exact message
   → Check Network tab → Last API call → Response
   → Documentation this in bugs list
```

### If Data Doesn't Persist After Navigate Away:
```
❌ Configuration lost after page refresh?
   → CRITICAL BUG #1 - database not saving
   → Verify API is being called: Network → POST /api/...
   → Check backend response (200 vs 400/500)
   
❌ Shows different data than what you inputted?
   → Data corruption issue
   → Check if other users/tabs are editing
```

---

## 🔧 BROWSER DEVELOPER TOOLS - QUICK GUIDE

### Open DevTools:
- **Windows:** F12 or Ctrl+Shift+I
- **Mac:** Cmd+Option+I

### Tabs You'll Need:
1. **Console Tab** - See JavaScript errors
2. **Network Tab** - See API requests and responses
3. **Elements Tab** - Inspect HTML structure

### How to Check API Response:
```
1. Open Network tab
2. Perform action (e.g., click "Save")
3. Look for API call: POST /api/tournaments/*/configure-round/
4. Click on it
5. Click "Response" tab
6. Check if it shows:
   ✅ {"status": "success"} - Good
   ❌ {"error": "..."} - Problem
   ❌ HTML error page - Backend crashed
```

---

## 🚀 RUNNING BACKEND/FRONTEND

### If Backend is Down:
```bash
# Terminal 1: Start Django
cd c:\Users\Kishan B M\scrimverse-backend
python manage.py runserver

# Terminal 2: Start Celery (if needed)
celery -A scrimverse worker -l info
```

### If Frontend is Down:
```bash
# Terminal 3: Start React
cd c:\Users\Kishan B M\scrimverse-frontend
npm start
```

### Verify Everything Running:
- Frontend: http://localhost:3000 (React app loads)
- Backend: http://localhost:8000 (Django API)
- Dashboard: http://localhost:3000/host/dashboard

---

## 📝 DOCUMENTING BUGS

When you find a bug, record immediately:

| When | Where | What |
|------|-------|------|
| Time | File | Exact steps to reproduce |
| Example | ManageTournament.js | 1. Click Configure Round 2. See modal 3. Enter teams 4. Click Save 5. Data lost |

---

## ✨ COMMON ISSUES & FIXES

### Issue: "You are not authorized to manage this tournament"
- **Fix:** Login as the host who created the tournament
- **Check:** AuthContext.isHost = true

### Issue: "Tournament not found"
- **Fix:** Tournament ID in URL is wrong
- **Check:** Copy ID from dashboard URL

### Issue: "Groups need at least 2 teams"
- **Fix:** Add more teams to groups
- **Check:** Minimum team requirement in code

### Issue: "Network request timeout"
- **Fix:** Backend is not running
- **Check:** Terminal shows `Quit the server with CTRL-BREAK` message

### Issue: Modal closes but nothing happened
- **Fix:** Check if validation failed silently
- **Action:** Open console (F12) and check for errors

---

## 🎬 ACTION ITEMS FOR NOW

- [ ] **IMMEDIATELY START:** Open VALORANT tournament
- [ ] **GO TO:** Manage → Round 1 → Configure
- [ ] **CREATE:** 2 groups with 7 teams total
- [ ] **SUBMIT:** Configuration
- [ ] **VERIFY:** Groups persists after page navigation
- [ ] **DOCUMENT:** Results in Phase 1 guide
- [ ] **REPORT:** Any bugs in bug tracking table
- [ ] **DO NOT PROCEED** to Phase 2 until Phase 1 ALL PASS

---

## 🆘 IF STUCK

1. **Check this guide first** - answer is likely here
2. **Check browser console** (F12 → Console) - errors shown there
3. **Check Network tab** - see what APIs are failing
4. **Check backend terminal** - see if there are server errors
5. **Check backend logs** - might have printed useful info

**NEVER proceed to next phase with failing tests** - each phase builds on previous!

---

Generated: February 26, 2026
Status: 🟢 READY TO TEST
