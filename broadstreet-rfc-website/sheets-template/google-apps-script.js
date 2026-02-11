/**
 * Broadstreet RFC - Google Apps Script
 * Calculates standings from a fixed baseline plus fixtures from baseline date onward.
 */

var CONFIG = {
  highlightTeam: "Broadstreet",
  fixturesTab: "fixtures",
  standingsTab: "standings",
  pointsForWin: 4,
  pointsForDraw: 2,
  pointsForLoss: 0,
  losingBonusMargin: 7,

  // Baseline is fixed at "today" when this strategy was introduced.
  // Fixtures before this date are ignored in calculations.
  baselineDate: "2026-02-10",

  // Baseline standings provided by admin.
  baselineStandings: [
    { team: "Market Harborough", played: 16, won: 14, drawn: 1, lost: 1, pf: 751, pa: 195, tb: 14, lb: 1, points: 73 },
    { team: "Northampton Old Scouts", played: 16, won: 13, drawn: 0, lost: 3, pf: 628, pa: 341, tb: 12, lb: 1, points: 66 },
    { team: "Broadstreet", played: 16, won: 12, drawn: 0, lost: 4, pf: 591, pa: 336, tb: 11, lb: 2, points: 61 },
    { team: "Bedford Athletic", played: 16, won: 12, drawn: 0, lost: 4, pf: 505, pa: 424, tb: 11, lb: 0, points: 59 },
    { team: "Peterborough", played: 16, won: 9, drawn: 1, lost: 6, pf: 588, pa: 370, tb: 11, lb: 2, points: 51 },
    { team: "Stamford", played: 16, won: 7, drawn: 2, lost: 7, pf: 424, pa: 447, tb: 10, lb: 2, points: 44 },
    { team: "Kettering", played: 16, won: 8, drawn: 0, lost: 8, pf: 448, pa: 358, tb: 9, lb: 1, points: 42 },
    { team: "Oadby Wyggestonians", played: 16, won: 5, drawn: 1, lost: 10, pf: 374, pa: 540, tb: 6, lb: 2, points: 30 },
    { team: "Olney", played: 16, won: 4, drawn: 0, lost: 12, pf: 396, pa: 556, tb: 8, lb: 4, points: 28 },
    { team: "Daventry", played: 16, won: 4, drawn: 1, lost: 11, pf: 320, pa: 584, tb: 5, lb: 2, points: 25 },
    { team: "Old Coventrians", played: 16, won: 4, drawn: 0, lost: 12, pf: 338, pa: 644, tb: 6, lb: 3, points: 20 },
    { team: "Wellingborough", played: 16, won: 1, drawn: 0, lost: 15, pf: 214, pa: 782, tb: 2, lb: 1, points: 7 }
  ],

  // Alias handling for small name differences.
  teamAliases: {
    "broadstreet rfc": "Broadstreet",
    "market harborough rfc": "Market Harborough",
    "northampton old scouts rfc": "Northampton Old Scouts",
    "bedford athletic rfc": "Bedford Athletic",
    "peterborough rfc": "Peterborough",
    "stamford rfc": "Stamford",
    "kettering rfc": "Kettering",
    "oadby wyggestonians rfc": "Oadby Wyggestonians",
    "olney rfc": "Olney",
    "daventry rfc": "Daventry",
    "old coventrians rfc": "Old Coventrians",
    "wellingborough rfc": "Wellingborough"
  }
};

function calculateStandings() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var fixturesSheet = ss.getSheetByName(CONFIG.fixturesTab);
  if (!fixturesSheet) {
    Logger.log("Error: '" + CONFIG.fixturesTab + "' tab not found.");
    return;
  }

  var data = fixturesSheet.getDataRange().getValues();
  if (data.length < 2) {
    Logger.log("No fixture rows found. Writing baseline standings only.");
  }

  var header = (data[0] || []).map(function (h) {
    return normalizeHeaderName_(h);
  });

  var col = {
    date: header.indexOf("date"),
    home_team: header.indexOf("home_team"),
    away_team: header.indexOf("away_team"),
    home_score: header.indexOf("home_score"),
    away_score: header.indexOf("away_score"),
    status: header.indexOf("status"),
    home_bp: header.indexOf("home_bp"),
    away_bp: header.indexOf("away_bp")
  };

  if (col.date === -1 || col.home_team === -1 || col.away_team === -1 || col.home_score === -1 || col.away_score === -1) {
    Logger.log("Error: fixtures tab must include date, home_team, away_team, home_score, away_score.");
    return;
  }

  var baselineDateObj = parseIsoDate_(CONFIG.baselineDate);
  if (!baselineDateObj) {
    Logger.log("Error: invalid CONFIG.baselineDate: " + CONFIG.baselineDate);
    return;
  }

  var teams = buildBaselineTeams_();
  var teamIndex = buildTeamIndex_(teams);

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row) continue;

    var homeScore = parseInt(row[col.home_score], 10);
    var awayScore = parseInt(row[col.away_score], 10);
    if (isNaN(homeScore) || isNaN(awayScore)) continue;

    var fixtureDate = parseFixtureDate_(row[col.date]);
    if (!fixtureDate) continue;
    if (fixtureDate.getTime() < baselineDateObj.getTime()) continue;

    var homeTeamName = resolveTeamName_(row[col.home_team], teams, teamIndex);
    var awayTeamName = resolveTeamName_(row[col.away_team], teams, teamIndex);
    if (!homeTeamName || !awayTeamName) continue;

    var home = teams[homeTeamName];
    var away = teams[awayTeamName];

    home.played++;
    away.played++;

    home.pf += homeScore;
    home.pa += awayScore;
    away.pf += awayScore;
    away.pa += homeScore;

    if (homeScore > awayScore) {
      home.won++;
      home.points += CONFIG.pointsForWin;
      away.lost++;
      away.points += CONFIG.pointsForLoss;
      if (homeScore - awayScore <= CONFIG.losingBonusMargin) {
        away.lb++;
        away.bp++;
        away.points++;
      }
    } else if (awayScore > homeScore) {
      away.won++;
      away.points += CONFIG.pointsForWin;
      home.lost++;
      home.points += CONFIG.pointsForLoss;
      if (awayScore - homeScore <= CONFIG.losingBonusMargin) {
        home.lb++;
        home.bp++;
        home.points++;
      }
    } else {
      home.drawn++;
      away.drawn++;
      home.points += CONFIG.pointsForDraw;
      away.points += CONFIG.pointsForDraw;
    }

    if (col.home_bp !== -1) {
      var homeTB = parseInt(row[col.home_bp], 10);
      if (!isNaN(homeTB) && homeTB > 0) {
        home.tb += homeTB;
        home.bp += homeTB;
        home.points += homeTB;
      }
    }
    if (col.away_bp !== -1) {
      var awayTB = parseInt(row[col.away_bp], 10);
      if (!isNaN(awayTB) && awayTB > 0) {
        away.tb += awayTB;
        away.bp += awayTB;
        away.points += awayTB;
      }
    }
  }

  var teamList = Object.keys(teams).map(function (name) {
    var t = teams[name];
    t.name = name;
    t.pd = t.pf - t.pa;
    return t;
  });

  teamList.sort(function (a, b) {
    if (b.points !== a.points) return b.points - a.points;
    if (b.pd !== a.pd) return b.pd - a.pd;
    return b.pf - a.pf;
  });

  var output = [[
    "position",
    "team",
    "played",
    "won",
    "drawn",
    "lost",
    "pf",
    "pa",
    "pd",
    "tb",
    "lb",
    "bp",
    "points",
    "highlight"
  ]];

  for (var r = 0; r < teamList.length; r++) {
    var team = teamList[r];
    var highlight = normalizeTeamKey_(team.name).indexOf(normalizeTeamKey_(CONFIG.highlightTeam)) !== -1;
    output.push([
      r + 1,
      team.name,
      team.played,
      team.won,
      team.drawn,
      team.lost,
      team.pf,
      team.pa,
      team.pd,
      team.tb,
      team.lb,
      team.bp,
      team.points,
      highlight ? "true" : "false"
    ]);
  }

  writeToSheet(CONFIG.standingsTab, output);
  Logger.log(
    "Standings updated. Baseline date: " +
      CONFIG.baselineDate +
      ", teams: " +
      teamList.length +
      ", fixtures scanned: " +
      Math.max(0, data.length - 1)
  );
}

function buildBaselineTeams_() {
  var teams = {};
  var rows = CONFIG.baselineStandings || [];

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i] || {};
    var name = String(row.team || "").trim();
    if (!name) continue;

    var tb = toInt_(row.tb);
    var lb = toInt_(row.lb);
    var points = toInt_(row.points);
    if (!points) {
      points = toInt_(row.won) * CONFIG.pointsForWin + toInt_(row.drawn) * CONFIG.pointsForDraw + tb + lb;
    }

    teams[name] = {
      played: toInt_(row.played),
      won: toInt_(row.won),
      drawn: toInt_(row.drawn),
      lost: toInt_(row.lost),
      pf: toInt_(row.pf),
      pa: toInt_(row.pa),
      tb: tb,
      lb: lb,
      bp: tb + lb,
      points: points
    };
  }

  return teams;
}

function buildTeamIndex_(teams) {
  var map = {};
  var aliases = CONFIG.teamAliases || {};

  for (var canonical in teams) {
    if (!teams.hasOwnProperty(canonical)) continue;
    map[normalizeTeamKey_(canonical)] = canonical;
  }

  for (var alias in aliases) {
    if (!aliases.hasOwnProperty(alias)) continue;
    var aliasKey = normalizeTeamKey_(alias);
    var target = String(aliases[alias] || "").trim();
    if (!target) continue;
    map[aliasKey] = target;
  }

  return map;
}

function resolveTeamName_(rawName, teams, teamIndex) {
  var clean = String(rawName || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";

  var key = normalizeTeamKey_(clean);
  var existingName = teamIndex[key];
  if (existingName) {
    if (!teams[existingName]) {
      teams[existingName] = newTeamStats_();
    }
    return existingName;
  }

  var canonical = clean.replace(/\s+rfc$/i, "").trim();
  if (!canonical) canonical = clean;

  if (!teams[canonical]) {
    teams[canonical] = newTeamStats_();
  }
  teamIndex[key] = canonical;
  teamIndex[normalizeTeamKey_(canonical)] = canonical;
  return canonical;
}

function newTeamStats_() {
  return {
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    pf: 0,
    pa: 0,
    tb: 0,
    lb: 0,
    bp: 0,
    points: 0
  };
}

function normalizeHeaderName_(value) {
  return String(value || "").toLowerCase().trim().replace(/\s+/g, "_");
}

function normalizeTeamKey_(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\brfc\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseIsoDate_(value) {
  var text = String(value || "").trim();
  var m = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return new Date(Date.UTC(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10), 12, 0, 0));
}

function parseFixtureDate_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate(), 12, 0, 0));
  }

  var text = String(value || "").trim();
  if (!text) return null;

  var iso = parseIsoDate_(text);
  if (iso) return iso;

  // DD/MM/YYYY — Google Sheets auto-converted dates
  var slashMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    var sd = parseInt(slashMatch[1], 10);
    var sm = parseInt(slashMatch[2], 10);
    var sy = parseInt(slashMatch[3], 10);
    if (sy > 1900 && sm >= 1 && sm <= 12) {
      return new Date(Date.UTC(sy, sm - 1, sd, 12, 0, 0));
    }
  }

  var match = text.match(/(\d{1,2})\s+([A-Za-z]{3,})\.?,?\s+(\d{4})/i);
  if (match) {
    var day = parseInt(match[1], 10);
    var monthName = match[2].toLowerCase();
    var year = parseInt(match[3], 10);
    var monthIndex = monthNameToIndex_(monthName);
    if (monthIndex >= 0) {
      return new Date(Date.UTC(year, monthIndex, day, 12, 0, 0));
    }
  }

  var fallback = new Date(text);
  if (isNaN(fallback.getTime())) return null;
  return new Date(Date.UTC(fallback.getFullYear(), fallback.getMonth(), fallback.getDate(), 12, 0, 0));
}

function monthNameToIndex_(name) {
  var key = String(name || "").toLowerCase();
  var map = {
    jan: 0,
    january: 0,
    feb: 1,
    february: 1,
    mar: 2,
    march: 2,
    apr: 3,
    april: 3,
    may: 4,
    jun: 5,
    june: 5,
    jul: 6,
    july: 6,
    aug: 7,
    august: 7,
    sep: 8,
    sept: 8,
    september: 8,
    oct: 9,
    october: 9,
    nov: 10,
    november: 10,
    dec: 11,
    december: 11
  };
  return map.hasOwnProperty(key) ? map[key] : -1;
}

function toInt_(value) {
  var n = parseInt(value, 10);
  return isNaN(n) ? 0 : n;
}

function onEdit(e) {
  var sheet = e && e.source ? e.source.getActiveSheet() : null;
  if (!sheet) return;
  if (sheet.getName() === CONFIG.fixturesTab) {
    calculateStandings();
  }
}

function writeToSheet(tabName, data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
  }

  sheet.clearContents();

  if (data.length > 0 && data[0].length > 0) {
    sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
  }

  var headerRange = sheet.getRange(1, 1, 1, data[0].length);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#1a1a2e");
  headerRange.setFontColor("#ffffff");

  for (var i = 1; i <= data[0].length; i++) {
    sheet.autoResizeColumn(i);
  }

  for (var r = 1; r < data.length; r++) {
    var teamName = String(data[r][1] || "").toLowerCase();
    if (teamName.indexOf(String(CONFIG.highlightTeam || "").toLowerCase()) !== -1) {
      var row = sheet.getRange(r + 1, 1, 1, data[0].length);
      row.setBackground("#fff3cd");
      row.setFontWeight("bold");
    }
  }
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Rugby Data")
    .addItem("Calculate Standings", "calculateStandings")
    .addToUi();
}
