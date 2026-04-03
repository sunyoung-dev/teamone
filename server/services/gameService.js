const VALID_POSITIONS = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
const VALID_RESULTS = ['W', 'L', 'D', null];
const VALID_STATUSES = ['scheduled', 'in_progress', 'final'];

/**
 * Validate a lineup array.
 * @param {Array<{playerId: string, battingOrder: number, position: string}>} lineup
 * @returns {string|null} Error message, or null if valid
 */
function validateLineup(lineup) {
  for (const entry of lineup) {
    if (!entry.playerId || !entry.battingOrder || !entry.position) {
      return 'playerId, battingOrder, position 필드가 필요합니다';
    }
    if (!VALID_POSITIONS.includes(entry.position)) {
      return `position은 ${VALID_POSITIONS.join(', ')} 중 하나여야 합니다`;
    }
    if (entry.battingOrder < 1 || entry.battingOrder > 9) {
      return 'battingOrder는 1에서 9 사이여야 합니다';
    }
  }
  const orders = lineup.map((e) => e.battingOrder);
  if (new Set(orders).size !== orders.length) return '타순이 중복되었습니다';
  const playerIds = lineup.map((e) => e.playerId);
  if (new Set(playerIds).size !== playerIds.length) return '동일한 선수가 중복 배치되었습니다';
  return null;
}

module.exports = { validateLineup, VALID_POSITIONS, VALID_RESULTS, VALID_STATUSES };
