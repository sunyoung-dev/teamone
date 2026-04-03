import { describe, test, expect } from 'vitest';
import {
  formatAvg,
  formatOps,
  formatStat,
  getResultType,
  isHit,
  countsAsAtBat,
} from './statsCalculator.js';

// ── formatAvg ──────────────────────────────────────────────────────────────
describe('formatAvg', () => {
  test('0.300 → ".300"', () => {
    expect(formatAvg(0.3)).toBe('.300');
  });

  test('0 → ".000"', () => {
    expect(formatAvg(0)).toBe('.000');
  });

  test('null → ".000"', () => {
    expect(formatAvg(null)).toBe('.000');
  });

  test('undefined → ".000"', () => {
    expect(formatAvg(undefined)).toBe('.000');
  });

  test('0.333 → ".333"', () => {
    expect(formatAvg(0.333)).toBe('.333');
  });

  test('1.000 → "1.000" (선두 0 제거 안 함)', () => {
    // 타율이 1이면 소수점 앞 1이 있으므로 그대로 출력
    expect(formatAvg(1.0)).toBe('1.000');
  });
});

// ── formatOps ──────────────────────────────────────────────────────────────
describe('formatOps', () => {
  test('1.050 → "1.050" (1 이상이면 선두 0 유지)', () => {
    expect(formatOps(1.05)).toBe('1.050');
  });

  test('0.850 → ".850" (0.xxx는 선두 0 제거)', () => {
    expect(formatOps(0.85)).toBe('.850');
  });

  test('0 → ".000"', () => {
    expect(formatOps(0)).toBe('.000');
  });

  test('null → ".000"', () => {
    expect(formatOps(null)).toBe('.000');
  });
});

// ── formatStat ─────────────────────────────────────────────────────────────
describe('formatStat', () => {
  test('정수 값은 그대로 문자열로', () => {
    expect(formatStat(5)).toBe('5');
  });

  test('null → "0"', () => {
    expect(formatStat(null)).toBe('0');
  });

  test('소수점 2자리 지정', () => {
    expect(formatStat(3.14159, 2)).toBe('3.14');
  });
});

// ── getResultType ──────────────────────────────────────────────────────────
describe('getResultType', () => {
  test.each(['1H', '2H', '3H', 'HR'])('%s → "hit"', (code) => {
    expect(getResultType(code)).toBe('hit');
  });

  test.each(['GO', 'FO', 'SO', 'DP', 'E'])('%s → "out"', (code) => {
    expect(getResultType(code)).toBe('out');
  });

  test.each(['BB', 'HBP'])('%s → "onBase"', (code) => {
    expect(getResultType(code)).toBe('onBase');
  });

  test.each(['SF', 'SH'])('%s → "sacrifice"', (code) => {
    expect(getResultType(code)).toBe('sacrifice');
  });

  test('알 수 없는 코드 → "unknown"', () => {
    expect(getResultType('ZZ')).toBe('unknown');
  });
});

// ── isHit ──────────────────────────────────────────────────────────────────
describe('isHit', () => {
  test.each(['1H', '2H', '3H', 'HR'])('%s 는 안타', (code) => {
    expect(isHit(code)).toBe(true);
  });

  test.each(['GO', 'FO', 'SO', 'DP', 'BB', 'HBP', 'SF', 'SH', 'E'])(
    '%s 는 안타가 아님',
    (code) => {
      expect(isHit(code)).toBe(false);
    }
  );
});

// ── countsAsAtBat ──────────────────────────────────────────────────────────
describe('countsAsAtBat', () => {
  test.each(['BB', 'HBP', 'SF', 'SH'])('%s 는 타수 제외', (code) => {
    expect(countsAsAtBat(code)).toBe(false);
  });

  test.each(['1H', '2H', '3H', 'HR', 'GO', 'FO', 'SO', 'DP', 'E'])(
    '%s 는 타수 포함',
    (code) => {
      expect(countsAsAtBat(code)).toBe(true);
    }
  );
});
