# Scrimverse E2E Testing Plan - HOST SIDE
**Date:** February 26, 2026  
**Focus:** Complete host-side functionality testing (No player registration/team signup)  
**Status:** STARTING

---

## 📋 HIGH-LEVEL FLOW
1. **Tournament Setup & Dashboard** ✓ (Already created)
2. **Round Configuration** (NEXT)
3. **Group Management** 
4. **Match Configuration**
5. **Match Scheduling**
6. **Match Points Entry & Results**
7. **Points Table & Rankings**
8. **Eliminated Teams Management**
9. **Prize Distribution**
10. **Tournament Completion Flow**

---

## 🎯 TEST TOURNAMENTS AVAILABLE
From Dashboard:
- ✓ CALL OF DUTY SQUAD - E2E TEST TOURNAMENT 3 (4 participants)
- ✓ BGMI SQUAD - E2E TEST TOURNAMENT 2 (6 participants)
- ✓ VALORANT 5V5 - E2E TEST TOURNAMENT 1 (7 participants)

---

## 📝 DETAILED TEST CASES

### PHASE 1: ROUND CONFIGURATION
**Tournament:** VALORANT 5V5 - E2E TEST TOURNAMENT 1 (7 teams)  
**Objective:** Set up Round 1 (Group Stage) with groups and test round progression

#### Test 1.1: View Tournament Dashboard
- [ ] Load tournament details page
- [ ] Verify all tournament info displays correctly
- [ ] Check tournament status = "live"
- [ ] Verify team count = 7
- [ ] Check current_round = 0

#### Test 1.2: Configure Round 1
- [ ] Click "Configure Round" button
- [ ] Set up groups (recommend 2 groups of 3-4 teams)
- [ ] Assign teams to groups via modal
- [ ] Submit round configuration
- [ ] Verify round_status changes to "upcoming"

---

### PHASE 2: MATCH CONFIGURATION & SCHEDULING
**Objective:** Create matches, configure match details, schedule them

#### Test 2.1: Create Matches in Group
- [ ] Select a group from Round 1
- [ ] View match creation interface
- [ ] Create matches for all teams in group (Round robin or system generated)
- [ ] Verify matches display in table
- [ ] Check match format is correct

#### Test 2.2: Schedule Matches
- [ ] Open bulk schedule modal or individual match scheduling
- [ ] Set match times (Test with different times)
- [ ] Set venue/location
- [ ] Save match schedule
- [ ] Verify schedule persists on refresh

#### Test 2.3: Match Configuration Details
- [ ] Edit individual match
- [ ] Configure match scoring type
- [ ] Set best of format (BO1, BO3, BO5)
- [ ] Add match rules/notes
- [ ] Save configuration

---

### PHASE 3: ROUND START & LIVE MANAGEMENT
**Objective:** Start round, go live, manage match progression

#### Test 3.1: Start Round
- [ ] Click "Start Round" button for Round 1
- [ ] Verify UI confirmation modal appears
- [ ] Confirm action
- [ ] Verify round_status changes to "ongoing"
- [ ] Check current_round updates to 1

#### Test 3.2: Live Matches Display
- [ ] Verify matches appear in "LIVE MATCHES" section on dashboard
- [ ] Check match status indicators
- [ ] Verify team names display correctly
- [ ] Test participant count shows correctly

---

### PHASE 4: MATCH RESULTS & SCORING
**Objective:** Enter match points, record winners, test scoring

#### Test 4.1: Enter Match Points (Group Stage)
- [ ] Select a match from first group
- [ ] Open "Match Points" modal
- [ ] Enter points for each team:
  - Team A: 50 points
  - Team B: 40 points
- [ ] Verify points display in table
- [ ] Check ranking updates based on points

#### Test 4.2: Record Multiple Match Results
- [ ] Complete 2-3 more matches with different results
- [ ] Verify points table updates in real-time
- [ ] Check team rankings change accordingly
- [ ] Verify standings in group

#### Test 4.3: Edit Match Points
- [ ] Go back to a completed match
- [ ] Edit points (increase/decrease)
- [ ] Verify automatic re-ranking
- [ ] Check no data corruption

---

### PHASE 5: POINTS TABLE & STANDINGS
**Objective:** Verify leaderboard, rankings, and statistics

#### Test 5.1: View Points Table
- [ ] Open Points Table modal
- [ ] Verify all groups display
- [ ] Check team rankings by order (highest points first)
- [ ] Verify points, wins, losses tally correctly
- [ ] Check head-to-head display (if available)

#### Test 5.2: Tie-Breaking Rules
- [ ] Create scenario with tied points (if possible)
- [ ] Verify tie-breaking logic works (by round wins, H2H, etc.)
- [ ] Confirm ranking is correct

---

### PHASE 6: ELIMINATED TEAMS MANAGEMENT
**Objective:** Mark teams as eliminated, manage dropouts

#### Test 6.1: Eliminate Teams
- [ ] Open "Eliminated Teams" modal
- [ ] Mark last-place team(s) as eliminated
- [ ] Verify eliminated teams don't appear in next round groups
- [ ] Check notification/logs for elimination

#### Test 6.2: Verify Eliminated Teams Handling
- [ ] Try creating new round
- [ ] Ensure eliminated teams are excluded
- [ ] Verify points table excludes them
- [ ] Check final standings calculation

---

### PHASE 7: ROUND PROGRESSION
**Objective:** Complete Round 1, move to knockouts

#### Test 7.1: Complete Round 1
- [ ] Finish all remaining matches in Round 1
- [ ] Verify all matches have results
- [ ] Click "Complete Round" button
- [ ] Verify round_status changes to "completed"

#### Test 7.2: Generate Knockout Bracket
- [ ] Configure Round 2 as knockout/elimination
- [ ] Generate bracket from Round 1 standings:
  - Teams finishing 1st in each group → Semifinals
  - Or follow your bracket logic
- [ ] Verify seeding is correct
- [ ] Check bracket visualization

---

### PHASE 8: KNOCKOUTS & FINALS
**Objective:** Test elimination rounds

#### Test 8.1: Setup Knockout Matches
- [ ] Create semifinal matches (2 matches)
- [ ] Schedule semifinals
- [ ] Enter results for semifinals

#### Test 8.2: Finals
- [ ] Generate final match from semifinal winners
- [ ] Schedule final match
- [ ] Enter final results
- [ ] Verify champion identification

---

### PHASE 9: PRIZE DISTRIBUTION
**Objective:** Verify prize pool and payouts

#### Test 9.1: View Prize Distribution
- [ ] Open Prize Distribution section
- [ ] Verify total prize pool = ₹{tournament_prize_pool}
- [ ] View distribution by placement:
  - 1st place winner
  - 2nd place
  - 3rd place (if applicable)
  - Other placements

#### Test 9.2: Edit Prize Distribution
- [ ] Modify prize distribution amounts
- [ ] Verify total doesn't exceed pool
- [ ] Save changes
- [ ] Check final standings reflect prize amounts

---

### PHASE 10: TOURNAMENT COMPLETION
**Objective:** Finalize tournament

#### Test 10.1: Mark Tournament Complete
- [ ] Verify all rounds completed
- [ ] Click "Complete Tournament" button
- [ ] Verify tournament status changes to "completed"
- [ ] Check final standings lock

#### Test 10.2: View Final Results
- [ ] Navigate to completed tournament
- [ ] View final leaderboard
- [ ] Verify winner info
- [ ] Check prize distribution display

---

## 🐛 BUG TRACKING
When you find bugs, log them here:

| # | Issue | Severity | Steps to Reproduce | Status |
|---|-------|----------|-------------------|--------|
| B1 | [Example] Match points not updating | HIGH | 1. Enter points 2. Check table | OPEN |
| | | | | |

---

## 🔍 TESTING NOTES

### Common Issues to Watch For:
- [ ] Data not persisting on page refresh
- [ ] UI not updating in real-time
- [ ] Incorrect calculations (points, rankings)
- [ ] API timeout or error handling
- [ ] Dates/times not displaying correctly
- [ ] Modal dialogs freezing or not closing
- [ ] Navigation breaking after operations
- [ ] Permission/authorization issues

### Test Environment:
- **Browser:** Chrome/Firefox/Edge
- **Backend:** Running locally at localhost:8000 (if applicable)
- **Frontend:** Running at localhost:3000
- **Test Data:** Using created tournaments with real teams

---

## ✅ SIGN-OFF

**Tester:** Kishan B M  
**Start Date:** Feb 26, 2026  
**Phase 1 Starting:** Round Configuration for VALORANT 5V5 Tournament

---

