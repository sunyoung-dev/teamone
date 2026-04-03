const { calculateStats } = require('../services/statsService');

describe('calculateStats', () => {
  // ── 빈 배열 ──────────────────────────────────────────────────────────────
  test('빈 배열이면 모든 스탯이 0', () => {
    const result = calculateStats([]);
    expect(result.plateAppearances).toBe(0);
    expect(result.atBats).toBe(0);
    expect(result.hits).toBe(0);
    expect(result.avg).toBe(0);
    expect(result.obp).toBe(0);
    expect(result.slg).toBe(0);
    expect(result.ops).toBe(0);
  });

  // ── 타수 계산 ──────────────────────────────────────────────────────────
  test('BB, HBP, SF, SH는 타수(AB)에 포함되지 않는다', () => {
    const atBats = [
      { result: 'BB' },
      { result: 'HBP' },
      { result: 'SF' },
      { result: 'SH' },
      { result: '1H' },
    ];
    const result = calculateStats(atBats);
    expect(result.plateAppearances).toBe(5);
    expect(result.atBats).toBe(1); // 단타 1개만 타수
  });

  // ── 안타 분류 ──────────────────────────────────────────────────────────
  test('단타(1H) 통계 계산', () => {
    const atBats = [{ result: '1H' }, { result: '1H' }, { result: 'GO' }];
    const result = calculateStats(atBats);
    expect(result.hits).toBe(2);
    expect(result.singles).toBe(2);
    expect(result.doubles).toBe(0);
    expect(result.totalBases).toBe(2);
  });

  test('2루타(2H), 3루타(3H), 홈런(HR) 총루타 계산', () => {
    const atBats = [
      { result: '2H' },
      { result: '3H' },
      { result: 'HR' },
    ];
    const result = calculateStats(atBats);
    expect(result.totalBases).toBe(2 + 3 + 4);
    expect(result.hits).toBe(3);
    expect(result.doubles).toBe(1);
    expect(result.triples).toBe(1);
    expect(result.homeRuns).toBe(1);
  });

  // ── 타율(AVG) ─────────────────────────────────────────────────────────
  test('타율(AVG) = 안타 / 타수', () => {
    // 3타수 1안타 → .333
    const atBats = [{ result: '1H' }, { result: 'GO' }, { result: 'SO' }];
    const result = calculateStats(atBats);
    expect(result.avg).toBe(Math.round((1 / 3) * 1000) / 1000);
  });

  test('타율은 소수점 3자리로 반올림된다', () => {
    // 4타수 1안타 → .250
    const atBats = [
      { result: '1H' },
      { result: 'GO' },
      { result: 'GO' },
      { result: 'GO' },
    ];
    const result = calculateStats(atBats);
    expect(result.avg).toBe(0.25);
  });

  // ── 출루율(OBP) ───────────────────────────────────────────────────────
  test('출루율(OBP) = (안타+BB+HBP) / (타수+BB+HBP+SF)', () => {
    // AB=2, H=1, BB=1, HBP=1, SF=1 → (1+1+1)/(2+1+1+1)=3/5=0.6
    const atBats = [
      { result: '1H' },
      { result: 'GO' },
      { result: 'BB' },
      { result: 'HBP' },
      { result: 'SF' },
    ];
    const result = calculateStats(atBats);
    expect(result.obp).toBe(Math.round((3 / 5) * 1000) / 1000);
  });

  test('출루 기회가 없으면 OBP는 0', () => {
    // BB만 있어도 (H+BB+HBP)/(AB+BB+HBP+SF) = 1/(0+1+0+0) = 1
    const result = calculateStats([{ result: 'BB' }]);
    expect(result.obp).toBe(1);
  });

  // ── 장타율(SLG) ───────────────────────────────────────────────────────
  test('장타율(SLG) = 총루타 / 타수', () => {
    // 홈런 1개, 타수 2 → SLG = 4/2 = 2.0
    const atBats = [{ result: 'HR' }, { result: 'GO' }];
    const result = calculateStats(atBats);
    expect(result.slg).toBe(2.0);
  });

  test('타수가 0이면 SLG는 0 (BB만 있을 때)', () => {
    const result = calculateStats([{ result: 'BB' }]);
    expect(result.slg).toBe(0);
  });

  // ── OPS ───────────────────────────────────────────────────────────────
  test('OPS = OBP + SLG', () => {
    const atBats = [{ result: '1H' }, { result: 'GO' }];
    const result = calculateStats(atBats);
    expect(result.ops).toBeCloseTo(result.obp + result.slg, 3);
  });

  // ── 아웃 카운트 ───────────────────────────────────────────────────────
  test('삼진/땅볼/플라이/병살 카운트', () => {
    const atBats = [
      { result: 'SO' },
      { result: 'GO' },
      { result: 'FO' },
      { result: 'DP' },
    ];
    const result = calculateStats(atBats);
    expect(result.strikeouts).toBe(1);
    expect(result.groundOuts).toBe(1);
    expect(result.flyOuts).toBe(1);
    expect(result.doublePlays).toBe(1);
  });

  // ── 실책(E) ───────────────────────────────────────────────────────────
  test('실책(E)은 타수에 포함되고 안타에는 포함되지 않는다', () => {
    const atBats = [{ result: 'E' }];
    const result = calculateStats(atBats);
    expect(result.errors).toBe(1);
    expect(result.hits).toBe(0);
    expect(result.atBats).toBe(1);
  });
});
