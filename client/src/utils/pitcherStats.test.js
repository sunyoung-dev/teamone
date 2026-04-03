import { describe, test, expect } from 'vitest';
import { buildInningPitcherMap, getLineupPitcherId, calcPitcherStatsMap } from './pitcherStats.js';

// ── buildInningPitcherMap ──────────────────────────────────────────────────
describe('buildInningPitcherMap', () => {
  test('빈 배열 → 빈 맵', () => {
    expect(buildInningPitcherMap([])).toEqual({});
  });

  test('단일 이닝 등판', () => {
    const map = buildInningPitcherMap([{ pitcherId: 'p1', startInning: 1, endInning: 1 }]);
    expect(map).toEqual({ 1: 'p1' });
  });

  test('복수 이닝 등판 → 이닝마다 매핑', () => {
    const map = buildInningPitcherMap([{ pitcherId: 'p1', startInning: 1, endInning: 3 }]);
    expect(map).toEqual({ 1: 'p1', 2: 'p1', 3: 'p1' });
  });

  test('여러 투수 교체 등판', () => {
    const map = buildInningPitcherMap([
      { pitcherId: 'p1', startInning: 1, endInning: 4 },
      { pitcherId: 'p2', startInning: 5, endInning: 7 },
    ]);
    expect(map[1]).toBe('p1');
    expect(map[4]).toBe('p1');
    expect(map[5]).toBe('p2');
    expect(map[7]).toBe('p2');
    expect(map[8]).toBeUndefined();
  });

  test('나중 등판이 같은 이닝을 덮어씀', () => {
    const map = buildInningPitcherMap([
      { pitcherId: 'p1', startInning: 1, endInning: 5 },
      { pitcherId: 'p2', startInning: 5, endInning: 7 },
    ]);
    expect(map[5]).toBe('p2');
  });
});

// ── getLineupPitcherId ─────────────────────────────────────────────────────
describe('getLineupPitcherId', () => {
  test('등판 기록 있으면 null 반환', () => {
    const lineup = [{ position: 'P', playerId: 'p1' }];
    const records = [{ pitcherId: 'p1', startInning: 1, endInning: 5 }];
    expect(getLineupPitcherId(lineup, records)).toBeNull();
  });

  test('등판 기록 없고 P 포지션 있으면 해당 playerId 반환', () => {
    const lineup = [
      { position: 'SS', playerId: 'p2' },
      { position: 'P', playerId: 'p1' },
    ];
    expect(getLineupPitcherId(lineup, [])).toBe('p1');
  });

  test('등판 기록 없고 P 포지션도 없으면 null', () => {
    const lineup = [{ position: 'CF', playerId: 'p3' }];
    expect(getLineupPitcherId(lineup, [])).toBeNull();
  });

  test('lineup이 undefined이면 null', () => {
    expect(getLineupPitcherId(undefined, [])).toBeNull();
  });
});

// ── calcPitcherStatsMap ────────────────────────────────────────────────────
describe('calcPitcherStatsMap', () => {
  const makeAb = (override = {}) => ({
    pitcherId: '',
    inning: 1,
    result: 'GO',
    run: 0,
    pitches: null,
    ...override,
  });

  test('타석 없으면 빈 맵', () => {
    expect(calcPitcherStatsMap([], {}, null)).toEqual({});
  });

  test('pitcherId와 inningPitcherMap 모두 없으면 lineupPitcherId 사용', () => {
    const abs = [makeAb({ pitches: 4 })];
    const stats = calcPitcherStatsMap(abs, {}, 'p1');
    expect(stats['p1']).toBeDefined();
    expect(stats['p1'].autoPitches).toBe(4);
  });

  test('명시적 pitcherId가 inningPitcherMap보다 우선', () => {
    const abs = [makeAb({ pitcherId: 'explicit', inning: 1, pitches: 5 })];
    const map = { 1: 'fromMap' };
    const stats = calcPitcherStatsMap(abs, map, null);
    expect(stats['explicit']).toBeDefined();
    expect(stats['fromMap']).toBeUndefined();
  });

  test('"undefined"/"null" 문자열 pitcherId는 무시하고 맵 사용', () => {
    const abs = [
      makeAb({ pitcherId: 'undefined', inning: 2, pitches: 3 }),
      makeAb({ pitcherId: 'null', inning: 2, pitches: 4 }),
    ];
    const map = { 2: 'p2' };
    const stats = calcPitcherStatsMap(abs, map, null);
    expect(stats['p2'].autoPitches).toBe(7);
    expect(stats['undefined']).toBeUndefined();
  });

  test('안타 집계 (1H/2H/3H/HR)', () => {
    const abs = ['1H', '2H', '3H', 'HR'].map((result) => makeAb({ pitcherId: 'p1', result }));
    const stats = calcPitcherStatsMap(abs, {}, null);
    expect(stats['p1'].H).toBe(4);
  });

  test('삼진(SO) 집계', () => {
    const abs = [makeAb({ pitcherId: 'p1', result: 'SO' }), makeAb({ pitcherId: 'p1', result: 'SO' })];
    expect(calcPitcherStatsMap(abs, {}, null)['p1'].K).toBe(2);
  });

  test('볼넷(BB)과 사구(HBP) 함께 집계', () => {
    const abs = [
      makeAb({ pitcherId: 'p1', result: 'BB' }),
      makeAb({ pitcherId: 'p1', result: 'HBP' }),
    ];
    expect(calcPitcherStatsMap(abs, {}, null)['p1'].BB).toBe(2);
  });

  test('실점(run) 합산', () => {
    const abs = [
      makeAb({ pitcherId: 'p1', run: 2 }),
      makeAb({ pitcherId: 'p1', run: 1 }),
    ];
    expect(calcPitcherStatsMap(abs, {}, null)['p1'].R).toBe(3);
  });

  test('모든 타석에 pitches 기록 → hasAllPitches=true, autoPitches 합산', () => {
    const abs = [
      makeAb({ pitcherId: 'p1', pitches: 4 }),
      makeAb({ pitcherId: 'p1', pitches: 6 }),
    ];
    const s = calcPitcherStatsMap(abs, {}, null)['p1'];
    expect(s.hasAllPitches).toBe(true);
    expect(s.autoPitches).toBe(10);
  });

  test('일부 타석에 pitches 누락 → hasAllPitches=false', () => {
    const abs = [
      makeAb({ pitcherId: 'p1', pitches: 4 }),
      makeAb({ pitcherId: 'p1', pitches: null }),
    ];
    const s = calcPitcherStatsMap(abs, {}, null)['p1'];
    expect(s.hasAllPitches).toBe(false);
    expect(s.autoPitches).toBe(4);
  });

  test('pitches=0은 null과 달리 집계됨', () => {
    const abs = [makeAb({ pitcherId: 'p1', pitches: 0 })];
    const s = calcPitcherStatsMap(abs, {}, null)['p1'];
    expect(s.hasAllPitches).toBe(true);
    expect(s.autoPitches).toBe(0);
  });

  test('pitcherId/inningMap/lineupId 모두 없으면 해당 타석 무시', () => {
    const abs = [makeAb({ pitcherId: '', inning: 99, pitches: 5 })];
    expect(calcPitcherStatsMap(abs, {}, null)).toEqual({});
  });

  test('복수 투수 각각 독립 집계', () => {
    const abs = [
      makeAb({ pitcherId: 'p1', result: '1H', pitches: 4 }),
      makeAb({ pitcherId: 'p2', result: 'SO', pitches: 5 }),
      makeAb({ pitcherId: 'p1', result: 'GO', pitches: 3 }),
    ];
    const stats = calcPitcherStatsMap(abs, {}, null);
    expect(stats['p1'].H).toBe(1);
    expect(stats['p1'].K).toBe(0);
    expect(stats['p1'].autoPitches).toBe(7);
    expect(stats['p2'].K).toBe(1);
    expect(stats['p2'].autoPitches).toBe(5);
  });
});
