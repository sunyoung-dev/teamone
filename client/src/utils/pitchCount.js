/**
 * 볼 카운트(볼/스트라이크/파울)로 타석 투구수를 계산한다.
 *
 * 규칙:
 *   - HBP: 항상 1구 (볼카운트 무관)
 *   - 그 외: balls + strikes + fouls + 1 (마지막 결정구)
 *   - 볼카운트 미입력(null): null 반환
 *
 * @param {number|null} balls    0-3
 * @param {number|null} strikes  0-2
 * @param {number}      fouls    0+
 * @param {string}      result   타석 결과 코드
 * @returns {number|null}
 */
export function calcPitches(balls, strikes, fouls, result) {
  if (result === 'HBP') return 1;
  if (balls == null || strikes == null) return null;
  return (balls ?? 0) + (strikes ?? 0) + (fouls ?? 0) + 1;
}

/**
 * 결과 코드에 따라 볼/스트라이크를 자동 보정한다.
 *   - BB  → 마지막 투구가 볼4 이므로 볼 카운트는 반드시 3
 *   - SO  → 마지막 투구가 스트3 이므로 스트라이크 카운트는 반드시 2
 *
 * @param {number} balls
 * @param {number} strikes
 * @param {string} result
 * @returns {{ balls: number, strikes: number }}
 */
export function autoCorrectCount(balls, strikes, result) {
  return {
    balls:   result === 'BB' ? 3 : balls,
    strikes: result === 'SO' ? 2 : strikes,
  };
}
