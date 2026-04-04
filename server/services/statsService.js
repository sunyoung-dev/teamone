// At-bat result classification constants
const HITS = ['1H', '2H', '3H', 'HR'];
const TOTAL_BASES = { '1H': 1, '2H': 2, '3H': 3, HR: 4 };

function count(atBats, result) {
  return atBats.filter((ab) => ab.result === result).length;
}

function countIn(atBats, results) {
  return atBats.filter((ab) => results.includes(ab.result)).length;
}

function sumTotalBases(atBats) {
  return atBats.reduce((sum, ab) => sum + (TOTAL_BASES[ab.result] || 0), 0);
}

function round3(n) {
  return Math.round(n * 1000) / 1000;
}

/**
 * Calculate batting statistics from an array of at-bat records.
 * Covers: AVG, G, PA, AB, R, H, 2B, 3B, HR, TB, RBI, SAC(SH), SF
 * @param {Array} atBats
 * @returns {object}
 */
function calculateStats(atBats) {
  const pa  = atBats.length;
  const bb  = countIn(atBats, ['BB', 'IBB']);
  const ibb = count(atBats, 'IBB');
  const hbp = count(atBats, 'HBP');
  const sf  = count(atBats, 'SF');
  const sh  = count(atBats, 'SH');
  const ci  = count(atBats, 'CI');
  // CI, IBB는 타수에서 제외
  const ab  = pa - bb - hbp - sf - sh - ci;

  const h          = countIn(atBats, HITS);
  const singles    = count(atBats, '1H');
  const doubles    = count(atBats, '2H');
  const triples    = count(atBats, '3H');
  const homeRuns   = count(atBats, 'HR');
  const strikeouts = count(atBats, 'SO');
  const groundOuts = count(atBats, 'GO');
  const flyOuts    = count(atBats, 'FO');
  const doublePlays = count(atBats, 'DP');
  const errors     = count(atBats, 'E');
  const fieldersChoice = count(atBats, 'FC');
  const tb         = sumTotalBases(atBats);

  // 득점/타점은 atBat 레코드의 run/rbi 필드 합산
  const runs = atBats.reduce((sum, ab) => sum + (ab.run || 0), 0);
  const rbi  = atBats.reduce((sum, ab) => sum + (ab.rbi || 0), 0);

  const avg = ab > 0 ? round3(h / ab) : 0;
  const obpDenom = ab + bb + hbp + sf;
  const obp = obpDenom > 0 ? round3((h + bb + hbp) / obpDenom) : 0;
  const slg = ab > 0 ? round3(tb / ab) : 0;
  const ops = round3(obp + slg);

  return {
    plateAppearances: pa,
    atBats: ab,
    hits: h,
    singles,
    doubles,
    triples,
    homeRuns,
    runs,
    rbi,
    walks: bb,
    intentionalWalks: ibb,
    hitByPitch: hbp,
    strikeouts,
    sacrificeFlies: sf,
    sacrificeBunts: sh,
    catchersInterference: ci,
    fieldersChoice,
    groundOuts,
    flyOuts,
    doublePlays,
    errors,
    totalBases: tb,
    avg,
    obp,
    slg,
    ops,
  };
}

module.exports = { calculateStats, HITS, TOTAL_BASES };
