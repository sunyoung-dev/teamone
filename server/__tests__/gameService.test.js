const { validateLineup } = require('../services/gameService');

const makeEntry = (override = {}) => ({
  playerId: 'p001',
  battingOrder: 1,
  position: 'SS',
  ...override,
});

describe('validateLineup', () => {
  // ── 정상 케이스 ───────────────────────────────────────────────────────
  test('유효한 라인업이면 null 반환', () => {
    const lineup = [
      makeEntry({ playerId: 'p001', battingOrder: 1, position: 'SS' }),
      makeEntry({ playerId: 'p002', battingOrder: 2, position: 'CF' }),
    ];
    expect(validateLineup(lineup)).toBeNull();
  });

  test('빈 배열은 null 반환', () => {
    expect(validateLineup([])).toBeNull();
  });

  // ── 필수 필드 누락 ────────────────────────────────────────────────────
  test('playerId 누락 → 에러', () => {
    expect(validateLineup([makeEntry({ playerId: '' })])).toBeTruthy();
  });

  test('battingOrder 누락(0이면 falsy) → 에러', () => {
    expect(validateLineup([makeEntry({ battingOrder: 0 })])).toBeTruthy();
  });

  test('position 누락 → 에러', () => {
    expect(validateLineup([makeEntry({ position: '' })])).toBeTruthy();
  });

  // ── 유효성 검사 ───────────────────────────────────────────────────────
  test('허용되지 않은 position → 에러', () => {
    expect(validateLineup([makeEntry({ position: 'XX' })])).toBeTruthy();
  });

  test('battingOrder > 9 → 에러', () => {
    expect(validateLineup([makeEntry({ battingOrder: 10 })])).toBeTruthy();
  });

  test('battingOrder < 1 (0 이하) → 에러', () => {
    expect(validateLineup([makeEntry({ battingOrder: 0 })])).toBeTruthy();
  });

  // ── 중복 검사 ─────────────────────────────────────────────────────────
  test('타순 중복 → 에러', () => {
    const lineup = [
      makeEntry({ playerId: 'p001', battingOrder: 1 }),
      makeEntry({ playerId: 'p002', battingOrder: 1 }),
    ];
    expect(validateLineup(lineup)).toBeTruthy();
  });

  test('동일 선수 중복 배치 → 에러', () => {
    const lineup = [
      makeEntry({ playerId: 'p001', battingOrder: 1 }),
      makeEntry({ playerId: 'p001', battingOrder: 2, position: 'CF' }),
    ];
    expect(validateLineup(lineup)).toBeTruthy();
  });

  // ── 허용되는 포지션 ───────────────────────────────────────────────────
  test.each(['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'])(
    '포지션 %s 는 유효하다',
    (position) => {
      expect(validateLineup([makeEntry({ position })])).toBeNull();
    }
  );
});
