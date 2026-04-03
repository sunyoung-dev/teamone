/**
 * Ball count validation and pitch count calculation for server-side use.
 * Mirrors the client-side pitchCount.js logic to ensure consistency.
 */

/**
 * Validate ball count fields from an at-bat record.
 * @param {{balls?: number|null, strikes?: number|null, fouls?: number|null, pitches?: number|null}} fields
 * @returns {string|null} Error message, or null if valid
 */
function validateBallCount({ balls, strikes, fouls, pitches } = {}) {
  if (balls !== null && balls !== undefined) {
    if (!Number.isInteger(balls) || balls < 0 || balls > 3) {
      return 'balls는 0~3 사이 정수여야 합니다';
    }
  }
  if (strikes !== null && strikes !== undefined) {
    if (!Number.isInteger(strikes) || strikes < 0 || strikes > 2) {
      return 'strikes는 0~2 사이 정수여야 합니다';
    }
  }
  if (fouls !== null && fouls !== undefined) {
    if (!Number.isInteger(fouls) || fouls < 0) {
      return 'fouls는 0 이상 정수여야 합니다';
    }
  }
  if (pitches !== null && pitches !== undefined) {
    if (!Number.isInteger(pitches) || pitches < 1) {
      return 'pitches는 1 이상 정수여야 합니다';
    }
  }
  return null;
}

/**
 * Calculate pitch count from ball count fields.
 * HBP is always 1 pitch. Returns null if balls or strikes is missing.
 * @param {number|null} balls
 * @param {number|null} strikes
 * @param {number} fouls
 * @param {string} result
 * @returns {number|null}
 */
function calcPitches(balls, strikes, fouls = 0, result) {
  if (result === 'HBP') return 1;
  if (balls == null || strikes == null) return null;
  return (balls ?? 0) + (strikes ?? 0) + (fouls ?? 0) + 1;
}

/**
 * Apply auto-correction rules:
 * - BB  → balls forced to 3
 * - SO  → strikes forced to 2
 * @param {number|null} balls
 * @param {number|null} strikes
 * @param {string} result
 * @returns {{balls: number|null, strikes: number|null}}
 */
function autoCorrectCount(balls, strikes, result) {
  return {
    balls:   result === 'BB' ? 3 : balls,
    strikes: result === 'SO' ? 2 : strikes,
  };
}

module.exports = { validateBallCount, calcPitches, autoCorrectCount };
