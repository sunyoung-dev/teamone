const { validateBallCount, calcPitches, autoCorrectCount } = require('../services/ballCountService');

// ── validateBallCount ─────────────────────────────────────────────────────────
describe('validateBallCount', () => {
  // 정상 케이스
  test('모든 필드가 null이면 null 반환', () => {
    expect(validateBallCount({ balls: null, strikes: null, fouls: null, pitches: null })).toBeNull();
  });

  test('모든 필드 undefined (생략)이면 null 반환', () => {
    expect(validateBallCount({})).toBeNull();
    expect(validateBallCount()).toBeNull();
  });

  test('유효한 값 (3볼 2스트 5파울 12구) → null', () => {
    expect(validateBallCount({ balls: 3, strikes: 2, fouls: 5, pitches: 12 })).toBeNull();
  });

  test('최솟값 (0볼 0스트 0파울 1구) → null', () => {
    expect(validateBallCount({ balls: 0, strikes: 0, fouls: 0, pitches: 1 })).toBeNull();
  });

  // balls 범위
  test('balls = -1 → 에러', () => {
    expect(validateBallCount({ balls: -1 })).toBeTruthy();
  });

  test('balls = 4 → 에러 (볼넷 이상 불가)', () => {
    expect(validateBallCount({ balls: 4 })).toBeTruthy();
  });

  test('balls = 1.5 (소수) → 에러', () => {
    expect(validateBallCount({ balls: 1.5 })).toBeTruthy();
  });

  // strikes 범위
  test('strikes = -1 → 에러', () => {
    expect(validateBallCount({ strikes: -1 })).toBeTruthy();
  });

  test('strikes = 3 → 에러 (삼진 이상 불가)', () => {
    expect(validateBallCount({ strikes: 3 })).toBeTruthy();
  });

  test('strikes = 0.5 (소수) → 에러', () => {
    expect(validateBallCount({ strikes: 0.5 })).toBeTruthy();
  });

  // fouls 범위
  test('fouls = -1 → 에러 (파울은 음수 불가)', () => {
    expect(validateBallCount({ fouls: -1 })).toBeTruthy();
  });

  test('fouls = 10 → null (파울 상한 없음)', () => {
    expect(validateBallCount({ fouls: 10 })).toBeNull();
  });

  // pitches 범위
  test('pitches = 0 → 에러 (1구 이상이어야 함)', () => {
    expect(validateBallCount({ pitches: 0 })).toBeTruthy();
  });

  test('pitches = -5 → 에러', () => {
    expect(validateBallCount({ pitches: -5 })).toBeTruthy();
  });

  test('pitches = 1.5 (소수) → 에러', () => {
    expect(validateBallCount({ pitches: 1.5 })).toBeTruthy();
  });
});

// ── calcPitches ───────────────────────────────────────────────────────────────
describe('calcPitches', () => {
  test('HBP는 항상 1구 (볼카운트 무관)', () => {
    expect(calcPitches(3, 2, 1, 'HBP')).toBe(1);
    expect(calcPitches(null, null, 0, 'HBP')).toBe(1);
  });

  test('balls null → null 반환', () => {
    expect(calcPitches(null, 1, 0, '1H')).toBeNull();
  });

  test('strikes null → null 반환', () => {
    expect(calcPitches(2, null, 0, 'GO')).toBeNull();
  });

  test('0볼 0스트 0파울 → 1구', () => {
    expect(calcPitches(0, 0, 0, '1H')).toBe(1);
  });

  test('3볼 2스트 0파울 → 6구', () => {
    expect(calcPitches(3, 2, 0, 'BB')).toBe(6);
  });

  test('0볼 2스트 3파울 삼진 → 6구', () => {
    expect(calcPitches(0, 2, 3, 'SO')).toBe(6);
  });

  test('fouls 기본값 0으로 처리', () => {
    // fouls 생략(undefined) → 0으로 계산
    expect(calcPitches(1, 1, undefined, '2H')).toBe(3);
  });
});

// ── autoCorrectCount ──────────────────────────────────────────────────────────
describe('autoCorrectCount', () => {
  test('BB → balls=3 강제', () => {
    expect(autoCorrectCount(1, 1, 'BB').balls).toBe(3);
  });

  test('BB일 때 strikes는 그대로', () => {
    expect(autoCorrectCount(1, 2, 'BB').strikes).toBe(2);
  });

  test('SO → strikes=2 강제', () => {
    expect(autoCorrectCount(2, 0, 'SO').strikes).toBe(2);
  });

  test('SO일 때 balls는 그대로', () => {
    expect(autoCorrectCount(2, 0, 'SO').balls).toBe(2);
  });

  test('HBP는 보정 없음', () => {
    const r = autoCorrectCount(0, 0, 'HBP');
    expect(r.balls).toBe(0);
    expect(r.strikes).toBe(0);
  });

  test('null 입력은 그대로 null 반환 (비 BB/SO 결과)', () => {
    const r = autoCorrectCount(null, null, '1H');
    expect(r.balls).toBeNull();
    expect(r.strikes).toBeNull();
  });

  test('BB일 때 balls가 null이어도 3으로 보정', () => {
    expect(autoCorrectCount(null, null, 'BB').balls).toBe(3);
  });

  test('SO일 때 strikes가 null이어도 2로 보정', () => {
    expect(autoCorrectCount(null, null, 'SO').strikes).toBe(2);
  });
});
