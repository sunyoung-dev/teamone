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

  test('fouls=undefined이면 0으로 처리', () => {
    expect(calcPitches(1, 1, undefined, 'GO')).toBe(3);
  });

  test('파울 많아도 정상 합산 (0볼 0스트 10파울 → 11구: 파울10 + 결정구1)', () => {
    expect(calcPitches(0, 0, 10, 'SO')).toBe(11);
  });

  test('BB 결과에서 balls/strikes 모두 있으면 정상 계산', () => {
    expect(calcPitches(3, 2, 1, 'BB')).toBe(7);
  });

  test('GO/FO/DP/E/SF/SH 결과 모두 null 없으면 정상 계산', () => {
    for (const result of ['GO', 'FO', 'DP', 'E', 'SF', 'SH']) {
      expect(calcPitches(1, 0, 0, result)).toBe(2);
    }
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

  test('HBP는 보정 없음', () => {
    const r = autoCorrectCount(0, 0, 'HBP');
    expect(r.balls).toBe(0);
    expect(r.strikes).toBe(0);
  });

  test('BB일 때 balls가 null이어도 3으로 보정', () => {
    expect(autoCorrectCount(null, null, 'BB').balls).toBe(3);
  });

  test('SO일 때 strikes가 null이어도 2로 보정', () => {
    expect(autoCorrectCount(null, null, 'SO').strikes).toBe(2);
  });

  test('null 입력에 비 BB/SO 결과 → null 그대로 반환', () => {
    const r = autoCorrectCount(null, null, 'GO');
    expect(r.balls).toBeNull();
    expect(r.strikes).toBeNull();
  });
});
