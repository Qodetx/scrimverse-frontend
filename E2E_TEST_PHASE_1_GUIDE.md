# 🚀 E2E TESTING - STEP-BY-STEP GUIDE - PHASE 1
**Start Date:** February 26, 2026  
**Focus:** Round Configuration for VALORANT Tournament  
**Target Tournament:** VALORANT 5V5 - E2E TEST TOURNAMENT 1 (7 teams)

---

## STEP 1️⃣: View Tournament Dashboard
**Objective:** Load the tournament and verify basic details

### Actions:
1. **Go to Dashboard** → Click on "VALORANT 5V5 - E2E TEST TOURNAMENT 1"
2. **Click "Manage"** button on the tournament card
3. **Note down the following:**
   - Tournament ID
   - Current Round (should be 0)
   - Tournament Status
   - Number of Registered Teams (should be 7)
   - Prize Pool amount

### Expected Result:
- Tournament details page loads without errors
- All info displays correctly
- 7 teams are shown as registered
- Current round = 0
- Status = "live" or "upcoming"

### ✅ Test 1.1 - PASS / ❌ FAIL: ___________

**If FAIL:** Document error here and check browser console for error messages

---

## STEP 2️⃣: Access Round Configuration
**Objective:** Open the Round Configuration modal

### Actions:
1. **Scroll down to "ROUNDS" section** on tournament page
2. **Find Round 1** in the list
3. **Click "Configure Round 1"** button (or similar button)
4. **A modal should open** showing group configuration options

### Expected Result:
- Round Configuration modal opens
- Modal shows option to create/configure groups
- You can see button to "Add Group" or "Configure Groups"
- Modal is responsive and buttons are clickable

### ✅ Test 1.2 - PASS / ❌ FAIL: ___________

**If FAIL:** 
- Check if button exists?
- Check browser console for JS errors
- Try right-click → Inspect to see modal HTML

---

## STEP 3️⃣: Configure Groups
**Objective:** Create 2-3 groups and assign teams

### Actions:
1. **In the modal, click "Add Group"** (or similar)
2. **For Group 1:**
   - Set name: "Group A"
   - Add teams: Select first 3-4 teams from dropdown
   - Click "Add" or "Confirm"
3. **For Group 2:**
   - Set name: "Group B"  
   - Add teams: Select remaining 3-4 teams
   - Click "Add" or "Confirm"

### Expected Result:
- Groups are created successfully
- Teams are assigned to groups (no duplicates)
- Group list shows Teams correctly
- Total teams in all groups = 7

### ✅ Test 1.3 - PASS / ❌ FAIL: ___________

**Note:** Take screenshot of final group configuration for reference

---

## STEP 4️⃣: Submit Round Configuration
**Objective:** Save the round configuration

### Actions:
1. **Review the groups** one more time
2. **Click "Save" or "Submit" button** at bottom of modal
3. **If confirmation popup appears,** click "Yes" or "Confirm"
4. **Wait for modal to close** and return to tournament page

### Expected Result:
- Modal closes without errors
- Toast message appears: "Round configured successfully" or similar
- Tournament page reloads
- Round 1 status changes from "upcoming" to "configured" (or similar)

### ✅ Test 1.4 - PASS / ❌ FAIL: ___________

---

## STEP 5️⃣: Verify Configuration Persists
**Objective:** Confirm data is saved in database

### Actions:
1. **Do NOT refresh page yet** - test saves to database first
2. **Replace the tournament URL** in browser to navigate away:
   - Go to a different page (e.g., Home/Dashboard)
3. **Come back to the tournament** by clicking "VALORANT 5V5 - E2E TEST TOURNAMENT 1" again
4. **Click "Manage"** and scroll to Round 1
5. **Verify groups are still there** - not lost

### Expected Result:
- Configuration persists after navigation
- Groups are visible with correct team assignments
- No data loss

### ✅ Test 1.5 - PASS / ❌ FAIL: ___________

**If FAIL:** This is a CRITICAL BUG - database not saving configuration

---

## STEP 6️⃣: Check Round Status
**Objective:** Verify round status tracking

### Actions:
1. **On tournament page, open browser DevTools** (F12)
2. **Go to Network tab**
3. **Refresh the page** (Ctrl+R)
4. **Look for API call:** `GET /api/tournaments/{id}/` or similar
5. **In Response tab, check JSON for:**
   ```json
   "round_status": {
     "1": "upcoming"  // or "configured"
   }
   ```

### Expected Result:
- API returns correct round status
- Round 1 is marked as "upcoming" or "configured"
- No API errors (status 200, not 500)

### ✅ Test 1.6 - PASS / ❌ FAIL: ___________

---

## 📋 SUMMARY - PHASE 1 RESULTS

| Test | Result | Notes |
|------|--------|-------|
| 1.1 - Tournament Dashboard | PASS / FAIL | |
| 1.2 - Open Config Modal | PASS / FAIL | |
| 1.3 - Create Groups | PASS / FAIL | |
| 1.4 - Submit Configuration | PASS / FAIL | |
| 1.5 - Persistence Check | PASS / FAIL | 🔴 CRITICAL |
| 1.6 - Status Tracking | PASS / FAIL | 🔴 CRITICAL |

---

## 🐛 BUGS FOUND IN PHASE 1

| Bug # | Description | Severity | Status |
|-------|-------------|----------|--------|
| | | | |
| | | | |

---

## 📝 NOTES

**What went well:**
- 

**What needs fixing:**
- 

**Next Step After Phase 1:** 
If all tests PASS → Move to PHASE 2: Match Configuration & Scheduling

---

**Tested By:** Kishan B M  
**Date:** ________________  
**Time Spent:** ________________  

