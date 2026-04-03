import { describe, test, expect } from 'vitest';
import { getEffectiveLineup, getEffectiveOpponentLineup } from './lineup.js';

// ── 헬퍼 ──────────────────────────────────────────────────────────────────
const makeLineup = () => [
  { playerId: 'p001', battingOrder: 1, position: 'SS' },
  { playerId: 'p002', battingOrder: 2, position: 'CF' },
  { playerId: 'p003', battingOrder: 3, position: '1B' },
];

const makeOpponentLineup = () => [
  { order: 1, name: '홍길동', number: 10, position: 'SS' },
  { order: 2, name: '김철수', number: 22, position: 'CF' },
  { order: 3, name: '이영희', number: 7, position: '1B' },
];

// ── getEffectiveLineup ─────────────────────────────────────────────────────
describe('getEffectiveLineup', () => {
  test('교체 없으면 원래 라인업 그대로', () => {
    const lineup = makeLineup();
    const result = getEffectiveLineup(lineup, [], 1);
    expect(result).toEqual(lineup);
  });

  test('교체가 해당 이닝에 적용된다', () => {
    const lineup = makeLineup();
    const subs = [
      { isOpponent: false, inning: 3, outPlayerId: 'p001', inPlayerId: 'p099', position: 'P' },
    ];
    const result = getEffectiveLineup(lineup, subs, 3);
    expect(result[0].playerId).toBe('p099');
    expect(result[0].position).toBe('P');
  });

  test('미래 이닝 교체는 현재 이닝에 반영되지 않는다', () => {
    const lineup = makeLineup();
    const subs = [
      { isOpponent: false, inning: 5, outPlayerId: 'p001', inPlayerId: 'p099', position: 'P' },
    ];
    const result = getEffectiveLineup(lineup, subs, 4);
    expect(result[0].playerId).toBe('p001');
  });

  test('같은 이닝 교체 2개가 순서대로 적용된다', () => {
    const lineup = makeLineup();
    const subs = [
      { isOpponent: false, inning: 2, outPlayerId: 'p001', inPlayerId: 'p099', position: 'DH' },
      { isOpponent: false, inning: 2, outPlayerId: 'p002', inPlayerId: 'p098', position: 'RF' },
    ];
    const result = getEffectiveLineup(lineup, subs, 2);
    expect(result[0].playerId).toBe('p099');
    expect(result[1].playerId).toBe('p098');
  });

  test('상대팀 교체(isOpponent=true)는 우리팀 라인업에 영향 없다', () => {
    const lineup = makeLineup();
    const subs = [
      { isOpponent: true, inning: 1, outPlayerId: 'p001', inPlayerId: 'p099', position: 'P' },
    ];
    const result = getEffectiveLineup(lineup, subs, 1);
    expect(result[0].playerId).toBe('p001');
  });

  test('원본 라인업 배열은 변경되지 않는다 (불변성)', () => {
    const lineup = makeLineup();
    getEffectiveLineup(lineup, [
      { isOpponent: false, inning: 1, outPlayerId: 'p001', inPlayerId: 'p099', position: 'P' },
    ], 1);
    expect(lineup[0].playerId).toBe('p001');
  });
});

// ── getEffectiveOpponentLineup ─────────────────────────────────────────────
describe('getEffectiveOpponentLineup', () => {
  test('교체 없으면 원래 라인업 그대로', () => {
    const lineup = makeOpponentLineup();
    const result = getEffectiveOpponentLineup(lineup, [], 1);
    expect(result).toEqual(lineup);
  });

  test('교체가 해당 이닝에 적용된다 (order 기준 매칭)', () => {
    const lineup = makeOpponentLineup();
    const subs = [
      {
        isOpponent: true,
        inning: 2,
        battingOrder: 1,
        inPlayerName: '박민준',
        inPlayerNumber: 99,
        position: 'P',
      },
    ];
    const result = getEffectiveOpponentLineup(lineup, subs, 2);
    expect(result[0].name).toBe('박민준');
    expect(result[0].number).toBe(99);
    expect(result[0].position).toBe('P');
  });

  test('미래 이닝 교체는 반영되지 않는다', () => {
    const lineup = makeOpponentLineup();
    const subs = [
      {
        isOpponent: true,
        inning: 4,
        battingOrder: 1,
        inPlayerName: '박민준',
        position: 'P',
      },
    ];
    const result = getEffectiveOpponentLineup(lineup, subs, 3);
    expect(result[0].name).toBe('홍길동');
  });

  test('우리팀 교체(isOpponent=false)는 상대 라인업에 영향 없다', () => {
    const lineup = makeOpponentLineup();
    const subs = [
      { isOpponent: false, inning: 1, battingOrder: 1, inPlayerName: '박민준', position: 'P' },
    ];
    const result = getEffectiveOpponentLineup(lineup, subs, 1);
    expect(result[0].name).toBe('홍길동');
  });
});
