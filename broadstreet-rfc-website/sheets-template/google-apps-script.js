/**
 * Broadstreet RFC - Google Apps Script
 * Auto-calculate standings from fixtures data
 *
 * HOW IT WORKS:
 * - Reads the "fixtures" tab for all completed matches
 * - Calculates W/D/L/Points for each team
 * - Auto-detects losing bonus points (lost by 7 or fewer)
 * - Reads try bonus points from "home_bp" and "away_bp" columns (if present)
 * - Writes the calculated standings to the "standings" tab
 *
 * HOW TO USE:
 * 1. Open your Google Sheet
 * 2. Go to Extensions → Apps Script
 * 3. Paste this entire code
 * 4. Click Save
 * 5. Run "calculateStandings" from the function dropdown
 * 6. (Optional) Set up automatic trigger:
 *    - The script auto-runs when you edit the fixtures tab
 *    - OR: Edit → Current project's triggers → Add trigger
 *      - Function: "calculateStandings"
 *      - Event source: "From spreadsheet"
 *      - Event type: "On edit"
 *
 * POINTS SYSTEM (RFU Standard):
 * - Win:  4 points
 * - Draw: 2 points
 * - Loss: 0 points
 * - Losing bonus point: +1 (lost by 7 or fewer points) — auto-calculated
 * - Try bonus point:    +1 (4+ tries scored) — enter in home_bp / away_bp columns
 *
 * CONFIG: Update the team name for highlighting
 */

var CONFIG = {
  highlightTeam: "Broadstreet",  // Team name to highlight in standings
  fixturesTab: "fixtures",       // Tab name for fixtures
  standingsTab: "standings",     // Tab name for standings
  pointsForWin: 4,
  pointsForDraw: 2,
  pointsForLoss: 0,
  losingBonusMargin: 7,         // Losing bonus if lost by this many or fewer
};

// ── Calculate Standings (main function) ──────────────────────────────
function calculateStandings() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var fixturesSheet = ss.getSheetByName(CONFIG.fixturesTab);

  if (!fixturesSheet) {
    Logger.log("Error: '" + CONFIG.fixturesTab + "' tab not found.");
    return;
  }

  var data = fixturesSheet.getDataRange().getValues();
  if (data.length < 2) {
    Logger.log("No fixture data found.");
    return;
  }

  // Parse header row to find column indices
  var header = data[0].map(function(h) { return String(h).toLowerCase().trim(); });
  var col = {
    home_team:  header.indexOf("home_team"),
    away_team:  header.indexOf("away_team"),
    home_score: header.indexOf("home_score"),
    away_score: header.indexOf("away_score"),
    status:     header.indexOf("status"),
    home_bp:    header.indexOf("home_bp"),
    away_bp:    header.indexOf("away_bp"),
  };

  // Validate required columns
  if (col.home_team === -1 || col.away_team === -1 || col.home_score === -1 || col.away_score === -1) {
    Logger.log("Error: fixtures tab must have columns: home_team, away_team, home_score, away_score");
    return;
  }

  // Build team stats
  var teams = {};

  for (var i = 1; i < data.length; i++) {
    var row = data[i];

    // Skip non-completed matches
    var status = col.status !== -1 ? String(row[col.status]).toLowerCase().trim() : "";
    var homeScore = parseInt(row[col.home_score], 10);
    var awayScore = parseInt(row[col.away_score], 10);

    // If status column exists, check it; otherwise check if scores are valid numbers
    if (col.status !== -1 && status !== "completed") continue;
    if (isNaN(homeScore) || isNaN(awayScore)) continue;

    var homeTeam = String(row[col.home_team]).trim();
    var awayTeam = String(row[col.away_team]).trim();
    if (!homeTeam || !awayTeam) continue;

    // Initialize teams if needed
    if (!teams[homeTeam]) teams[homeTeam] = newTeamStats();
    if (!teams[awayTeam]) teams[awayTeam] = newTeamStats();

    var home = teams[homeTeam];
    var away = teams[awayTeam];

    // Update played
    home.played++;
    away.played++;

    // Update points for/against
    home.pf += homeScore;
    home.pa += awayScore;
    away.pf += awayScore;
    away.pa += homeScore;

    // Determine result
    if (homeScore > awayScore) {
      // Home win
      home.won++;
      home.points += CONFIG.pointsForWin;
      away.lost++;
      away.points += CONFIG.pointsForLoss;
      // Losing bonus for away team?
      if (homeScore - awayScore <= CONFIG.losingBonusMargin) {
        away.bp++;
        away.points++;
      }
    } else if (awayScore > homeScore) {
      // Away win
      away.won++;
      away.points += CONFIG.pointsForWin;
      home.lost++;
      home.points += CONFIG.pointsForLoss;
      // Losing bonus for home team?
      if (awayScore - homeScore <= CONFIG.losingBonusMargin) {
        home.bp++;
        home.points++;
      }
    } else {
      // Draw
      home.drawn++;
      home.points += CONFIG.pointsForDraw;
      away.drawn++;
      away.points += CONFIG.pointsForDraw;
    }

    // Try bonus points (from manual columns if they exist)
    if (col.home_bp !== -1) {
      var homeBP = parseInt(row[col.home_bp], 10);
      if (!isNaN(homeBP) && homeBP > 0) {
        home.bp += homeBP;
        home.points += homeBP;
      }
    }
    if (col.away_bp !== -1) {
      var awayBP = parseInt(row[col.away_bp], 10);
      if (!isNaN(awayBP) && awayBP > 0) {
        away.bp += awayBP;
        away.points += awayBP;
      }
    }
  }

  // Convert to sorted array
  var teamList = Object.keys(teams).map(function(name) {
    var t = teams[name];
    t.name = name;
    t.pd = t.pf - t.pa; // point difference
    return t;
  });

  // Sort: points desc, then point difference desc, then points for desc
  teamList.sort(function(a, b) {
    if (b.points !== a.points) return b.points - a.points;
    if (b.pd !== a.pd) return b.pd - a.pd;
    return b.pf - a.pf;
  });

  // Build output for standings tab
  var output = [["position", "team", "played", "won", "drawn", "lost", "pf", "pa", "pd", "bp", "points", "highlight"]];

  teamList.forEach(function(t, idx) {
    var isHighlight = t.name.toLowerCase().indexOf(CONFIG.highlightTeam.toLowerCase()) !== -1;
    output.push([
      idx + 1,
      t.name,
      t.played,
      t.won,
      t.drawn,
      t.lost,
      t.pf,
      t.pa,
      t.pd,
      t.bp,
      t.points,
      isHighlight ? "true" : "false"
    ]);
  });

  // Write to standings tab
  writeToSheet(CONFIG.standingsTab, output);
  Logger.log("Standings calculated: " + teamList.length + " teams from " + (data.length - 1) + " fixtures.");
}

function newTeamStats() {
  return { played: 0, won: 0, drawn: 0, lost: 0, pf: 0, pa: 0, bp: 0, points: 0 };
}

// ── Auto-trigger on edit ─────────────────────────────────────────────
// This runs automatically when any cell is edited
function onEdit(e) {
  var sheet = e.source.getActiveSheet();
  if (sheet.getName() === CONFIG.fixturesTab) {
    calculateStandings();
  }
}

// ── Write to Sheet ───────────────────────────────────────────────────
function writeToSheet(tabName, data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(tabName);

  if (!sheet) {
    sheet = ss.insertSheet(tabName);
  }

  // Clear existing data
  sheet.clearContents();

  // Write new data
  if (data.length > 0 && data[0].length > 0) {
    sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
  }

  // Format header row
  var headerRange = sheet.getRange(1, 1, 1, data[0].length);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#1a1a2e");
  headerRange.setFontColor("#ffffff");

  // Auto-resize columns
  for (var i = 1; i <= data[0].length; i++) {
    sheet.autoResizeColumn(i);
  }

  // Highlight the team row
  for (var r = 1; r < data.length; r++) {
    var teamName = String(data[r][1]).toLowerCase();
    if (teamName.indexOf(CONFIG.highlightTeam.toLowerCase()) !== -1) {
      var row = sheet.getRange(r + 1, 1, 1, data[0].length);
      row.setBackground("#fff3cd");
      row.setFontWeight("bold");
    }
  }
}

// ── Custom Menu ──────────────────────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Rugby Data")
    .addItem("Calculate Standings", "calculateStandings")
    .addToUi();
}
