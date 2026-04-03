/**
 * Build a map of inning → pitcherId from pitching records.
 * @param {Array<{pitcherId: string, startInning: number, endInning: number}>} pitchingRecords
 * @returns {Object.<number, string>}
 */
export function buildInningPitcherMap(pitchingRecords) {
  const map = {};
  pitchingRecords.forEach((rec) => {
    for (let inn = rec.startInning; inn <= rec.endInning; inn++) {
      map[inn] = rec.pitcherId;
    }
  });
  return map;
}

/**
 * Derive the fallback pitcher ID from lineup when no pitching records exist.
 * @param {Array<{position: string, playerId: string}>} lineup
 * @param {Array} pitchingRecords
 * @returns {string|null}
 */
export function getLineupPitcherId(lineup, pitchingRecords) {
  if (pitchingRecords.length > 0) return null;
  return (lineup || []).find((e) => e.position === 'P')?.playerId || null;
}

/**
 * Calculate per-pitcher stats from opponent at-bats.
 *
 * For each at-bat:
 *  1. Use ab.pitcherId if it is a real ID (not empty/"undefined"/"null")
 *  2. Fall back to inningPitcherMap[ab.inning]
 *  3. Fall back to lineupPitcherId
 *
 * Returns a map keyed by pitcherId:
 *  { H, K, BB, R, autoPitches, hasAllPitches }
 *  - autoPitches: sum of ab.pitches for this pitcher
 *  - hasAllPitches: false if ANY at-bat for this pitcher has pitches == null
 *
 * @param {Array} opponentAtBats
 * @param {Object.<number, string>} inningPitcherMap
 * @param {string|null} lineupPitcherId
 * @returns {Object.<string, {H: number, K: number, BB: number, R: number, autoPitches: number, hasAllPitches: boolean}>}
 */
export function calcPitcherStatsMap(opponentAtBats, inningPitcherMap, lineupPitcherId) {
  const statsMap = {};

  opponentAtBats.forEach((ab) => {
    const rawId = ab.pitcherId;
    const explicitId = (rawId && rawId !== 'undefined' && rawId !== 'null') ? rawId : '';
    const pid = explicitId || inningPitcherMap[ab.inning] || lineupPitcherId;
    if (!pid) return;

    if (!statsMap[pid]) {
      statsMap[pid] = { H: 0, K: 0, BB: 0, R: 0, autoPitches: 0, hasAllPitches: true };
    }
    const s = statsMap[pid];
    if (['1H', '2H', '3H', 'HR'].includes(ab.result)) s.H += 1;
    if (ab.result === 'SO') s.K += 1;
    if (ab.result === 'BB' || ab.result === 'HBP') s.BB += 1;
    s.R += ab.run || 0;
    if (ab.pitches != null) {
      s.autoPitches += ab.pitches;
    } else {
      s.hasAllPitches = false;
    }
  });

  return statsMap;
}
