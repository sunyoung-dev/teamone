import { describe, test, expect } from 'vitest';
import { calcPitches, autoCorrectCount } from './pitchCount.js';

// ── calcPitches ────────────────────────────────────────────────────────────
describe('calcPitches', () => {
  test('HBP는 결과가 항상 1구', () => {
    expect(calcPitches(3, 2, 1, 'HBP')).toBe(1);
    expect(calcPitches(0, 0, 0, 'HBP')).toBe(1);
    expect(calcPitches(null, null, 0, 'HBP')).toBe(1);
  });

  test('볼카운트 미입력(null)이면 null 반환', () => {
    expect(calcPitches(null, null, 0, '1H')).toBeNull();
  });

  test('balls만 있어도 (strikes null) null 반환', () => {
    expect(calcPitches(2, null, 0, 'GO')).toBeNull();
  });

  test('strikes만 있어도 (balls null) null 반환', () => {
    expect(calcPitches(null, 1, 0, 'FO')).toBeNull();
  });

  test('0볼 0스트 0파울 → 1구 (초구 인플레이)', () => {
    expect(calcPitches(0, 0, 0, '1H')).toBe(1);
  });

  test('3볼 2스트 0파울 → 6구 (풀카운트 결정)', () => {
    expect(calcPitches(3, 2, 0, 'BB')).toBe(6);
  });

  test('파울이 추가된 경우 합산 반영', () => {
    // 0볼 2스트 3파울 → 삼진: 0+2+3+1 = 6구
    expect(calcPitches(0, 2, 3, 'SO')).toBe(6);
  });

  test('2볼 1스트 1파울 단타 → 5구', () => {
    expect(calcPitches(2, 1, 1, '1H')).toBe(5);
  });

  test('1볼 2스트 0파울 홈런 → 4구', () => {
    expect(calcPitches(1, 2, 0, 'HR')).toBe(4);
  });
});

// ── autoCorrectCount ───────────────────────────────────────────────────────
describe('autoCorrectCount', () => {
  test('BB이면 볼을 3으로 보정', () => {
    expect(autoCorrectCount(1, 1, 'BB').balls).toBe(3);
  });

  test('BB일 때 스트라이크는 변경 없음', () => {
    expect(autoCorrectCount(1, 1, 'BB').strikes).toBe(1);
  });

  test('SO이면 스트라이크를 2로 보정', () => {
    expect(autoCorrectCount(2, 0, 'SO').strikes).toBe(2);
  });

  test('SO일 때 볼은 변경 없음', () => {
    expect(autoCorrectCount(2, 0, 'SO').balls).toBe(2);
  });

  test('이미 BB 볼카운트가 3이면 그대로', () => {
    expect(autoCorrectCount(3, 2, 'BB').balls).toBe(3);
  });

  test('다른 결과(1H)는 보정 없음', () => {
    const result = autoCorrectCount(1, 1, '1H');
    expect(result.balls).toBe(1);
    expect(result.strikes).toBe(1);
  });

  test('GO, FO, 1H, 2H, 3H, HR, DP, SF, SH, E 는 보정 없음', () => {
    for (const code of ['GO', 'FO', '2H', '3H', 'HR', 'DP', 'SF', 'SH', 'E']) {
      const r = autoCorrectCount(0, 0, code);
      expect(r.balls).toBe(0);
      expect(r.strikes).toBe(0);
    }
  });
});
