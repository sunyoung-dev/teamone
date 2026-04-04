import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import { RESULT_CODES, RESULT_TYPE_COLORS, HIT_TYPES } from '../../utils/constants.js';

const CELL_W = 52;
const CELL_H = 60;
const HEADER_W = 80;

// 결과 유형에 따른 셀 색상
function getResultColors(result) {
  if (!result) return { bg: '#f8fafc', text: '#94a3b8', border: '#e2e8f0' };
  const info = RESULT_CODES[result];
  if (!info) return { bg: '#f8fafc', text: '#475569', border: '#cbd5e1' };
  const type = info.type;
  const palette = RESULT_TYPE_COLORS[type] || RESULT_TYPE_COLORS.sacrifice;
  return { bg: palette.bg, text: palette.text, border: palette.border };
}

// 전통 스코어카드 다이아몬드 아이콘 (SVG)
function Diamond({ size = 20, runScored = false, baseReached = 0 }) {
  // baseReached: 0=out, 1=1루, 2=2루, 3=3루, 4=홈인
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  // 다이아몬드 꼭짓점 (홈-1루-2루-3루)
  const pts = [
    [cx, cy + r],       // 홈 (하단)
    [cx + r, cy],       // 1루 (우)
    [cx, cy - r],       // 2루 (상단)
    [cx - r, cy],       // 3루 (좌)
  ];

  const lineColor = runScored ? '#1b5e20' : '#94a3b8';
  const fillColor = runScored ? '#dcfce7' : 'none';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* 다이아몬드 외곽선 */}
      <polygon
        points={pts.map(p => p.join(',')).join(' ')}
        fill={fillColor}
        stroke={lineColor}
        strokeWidth={1.5}
      />
      {/* 홈플레이트 표시 */}
      <circle cx={pts[0][0]} cy={pts[0][1]} r={2} fill={lineColor} />
    </svg>
  );
}

// 개별 스코어카드 셀 (한 이닝, 한 타자)
function ScoreCell({ atBat, isCurrent }) {
  if (!atBat) {
    return (
      <Box sx={{
        width: CELL_W, minHeight: CELL_H,
        border: '1px solid #e2e8f0',
        bgcolor: isCurrent ? '#fffbeb' : '#fafafa',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isCurrent && (
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#f59e0b' }} />
        )}
      </Box>
    );
  }

  const colors = getResultColors(atBat.result);
  const info = RESULT_CODES[atBat.result];
  const hitTypeInfo = atBat.hitType ? HIT_TYPES.find(h => h.code === atBat.hitType) : null;
  const fielderStr = atBat.fielders?.length > 0 ? atBat.fielders.join('-') : null;
  const runScored = (atBat.run || 0) > 0;

  const tooltipContent = [
    `${atBat.result}${info ? ` (${info.label})` : ''}`,
    hitTypeInfo ? hitTypeInfo.label : null,
    atBat.hitDirection || null,
    fielderStr ? `수비: ${fielderStr}` : null,
    atBat.run ? `득점: ${atBat.run}` : null,
    atBat.rbi ? `타점: ${atBat.rbi}` : null,
    atBat.pitches ? `${atBat.pitches}구` : null,
    atBat.note || null,
  ].filter(Boolean).join(' · ');

  return (
    <Tooltip title={tooltipContent} placement="top" arrow>
      <Box sx={{
        width: CELL_W, minHeight: CELL_H,
        bgcolor: colors.bg,
        border: `1px solid ${colors.border}`,
        borderLeft: `3px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.25,
        cursor: 'default',
        position: 'relative',
        '&:hover': { filter: 'brightness(0.96)' },
      }}>
        {/* 득점 표시 (좌상단) */}
        {runScored && (
          <Box sx={{
            position: 'absolute', top: 2, left: 2,
            width: 14, height: 14, borderRadius: '50%',
            bgcolor: '#1b5e20', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Typography sx={{ fontSize: '0.55rem', fontWeight: 800, lineHeight: 1 }}>
              {atBat.run}
            </Typography>
          </Box>
        )}

        {/* 결과 코드 */}
        <Typography sx={{
          fontFamily: '"Roboto Mono", monospace',
          fontWeight: 800,
          fontSize: '0.8rem',
          color: colors.text,
          lineHeight: 1,
        }}>
          {atBat.result}
        </Typography>

        {/* 타구 유형 + 방향 */}
        {(atBat.hitType || atBat.hitDirection) && (
          <Typography sx={{ fontSize: '0.55rem', color: colors.text, opacity: 0.75, lineHeight: 1, fontFamily: '"Roboto Mono", monospace' }}>
            {[atBat.hitType, atBat.hitDirection].filter(Boolean).join('·')}
          </Typography>
        )}

        {/* 수비수 번호 */}
        {fielderStr && (
          <Typography sx={{ fontSize: '0.6rem', color: colors.text, opacity: 0.8, lineHeight: 1, fontFamily: '"Roboto Mono", monospace' }}>
            {fielderStr}
          </Typography>
        )}

        {/* 투구수 */}
        {atBat.pitches && (
          <Typography sx={{ position: 'absolute', bottom: 2, right: 3, fontSize: '0.5rem', color: colors.text, opacity: 0.6, fontFamily: '"Roboto Mono", monospace' }}>
            {atBat.pitches}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
}

export default function ScoreCardGrid({ atBats, players, lineup, maxInning }) {
  // lineup 순서대로 선수 정렬
  const orderedLineup = [...(lineup || [])].sort((a, b) => a.battingOrder - b.battingOrder);

  // playerId → player 맵
  const playerMap = {};
  for (const p of (players || [])) playerMap[p.id || p._id] = p;

  // playerId + inning → atBat 매핑
  const atBatMap = {};
  for (const ab of (atBats || [])) {
    const key = `${ab.playerId}-${ab.inning}`;
    if (!atBatMap[key]) atBatMap[key] = ab;
  }

  // 이닝별 통계 계산
  const inningStats = {};
  for (let i = 1; i <= maxInning; i++) {
    const inningAbs = (atBats || []).filter(ab => ab.inning === i);
    inningStats[i] = {
      runs: inningAbs.reduce((sum, ab) => sum + (ab.run || 0), 0),
      hits: inningAbs.filter(ab => ['1H', '2H', '3H', 'HR'].includes(ab.result)).length,
    };
  }

  // 선수별 통계 계산
  const playerStats = {};
  for (const entry of orderedLineup) {
    const pAbats = (atBats || []).filter(ab => ab.playerId === entry.playerId);
    playerStats[entry.playerId] = {
      pa: pAbats.length,
      ab: pAbats.filter(ab => !['BB', 'IBB', 'HBP', 'SF', 'SH', 'CI'].includes(ab.result)).length,
      h: pAbats.filter(ab => ['1H', '2H', '3H', 'HR'].includes(ab.result)).length,
      r: pAbats.reduce((sum, ab) => sum + (ab.run || 0), 0),
      rbi: pAbats.reduce((sum, ab) => sum + (ab.rbi || 0), 0),
    };
  }

  const innings = Array.from({ length: maxInning }, (_, i) => i + 1);
  const totalRuns = innings.reduce((sum, i) => sum + inningStats[i].runs, 0);
  const totalHits = innings.reduce((sum, i) => sum + inningStats[i].hits, 0);

  return (
    <Box sx={{ overflowX: 'auto', pb: 2 }}>
      <Box sx={{ display: 'inline-block', minWidth: '100%' }}>
        {/* 헤더 행 */}
        <Box sx={{ display: 'flex', borderBottom: '2px solid #0d1b3e' }}>
          {/* 선수 컬럼 헤더 */}
          <Box sx={{
            width: HEADER_W, minWidth: HEADER_W, flexShrink: 0,
            bgcolor: '#0d1b3e', color: '#fff',
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center',
            px: 1, py: 0.75,
          }}>
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, opacity: 0.7, lineHeight: 1 }}>타순</Typography>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, lineHeight: 1.2 }}>선수</Typography>
          </Box>

          {/* 이닝 헤더 */}
          {innings.map(inn => (
            <Box key={inn} sx={{
              width: CELL_W, minWidth: CELL_W, flexShrink: 0,
              bgcolor: '#0d1b3e', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderLeft: '1px solid rgba(255,255,255,0.15)',
            }}>
              <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 700, fontSize: '0.85rem' }}>
                {inn}
              </Typography>
            </Box>
          ))}

          {/* 통계 헤더 */}
          {['PA', 'AB', 'H', 'R', 'RBI'].map(stat => (
            <Box key={stat} sx={{
              width: 36, minWidth: 36, flexShrink: 0,
              bgcolor: '#1a2d5a', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderLeft: stat === 'PA' ? '2px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.15)',
            }}>
              <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 700, fontSize: '0.65rem' }}>
                {stat}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* 선수 행 */}
        {orderedLineup.map((entry, idx) => {
          const player = playerMap[entry.playerId];
          const stats = playerStats[entry.playerId] || { pa: 0, ab: 0, h: 0, r: 0, rbi: 0 };
          const hasAnyResult = innings.some(inn => atBatMap[`${entry.playerId}-${inn}`]);

          return (
            <Box key={entry.playerId} sx={{
              display: 'flex',
              borderBottom: '1px solid #e2e8f0',
              bgcolor: idx % 2 === 0 ? 'white' : '#fafafa',
              '&:hover': { bgcolor: '#f0f4ff' },
            }}>
              {/* 선수 정보 */}
              <Box sx={{
                width: HEADER_W, minWidth: HEADER_W, flexShrink: 0,
                px: 1, py: 0.5,
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
                borderRight: '2px solid #e2e8f0',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#0d1b3e', minWidth: 14, fontFamily: '"Roboto Mono", monospace' }}>
                    {entry.battingOrder}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 50 }}>
                    {player?.name || '?'}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '0.55rem', color: 'text.secondary', fontFamily: '"Roboto Mono", monospace' }}>
                  {entry.position || ''}
                  {player?.number ? ` #${player.number}` : ''}
                </Typography>
              </Box>

              {/* 이닝별 타석 결과 */}
              {innings.map(inn => (
                <ScoreCell
                  key={inn}
                  atBat={atBatMap[`${entry.playerId}-${inn}`]}
                  isCurrent={false}
                />
              ))}

              {/* 선수 통계 */}
              {[stats.pa, stats.ab, stats.h, stats.r, stats.rbi].map((val, i) => (
                <Box key={i} sx={{
                  width: 36, minWidth: 36, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderLeft: i === 0 ? '2px solid #e2e8f0' : '1px solid #f0f0f0',
                  bgcolor: i === 2 && val > 0 ? '#f0fdf4' : i === 3 && val > 0 ? '#eff6ff' : 'transparent',
                }}>
                  <Typography sx={{
                    fontFamily: '"Roboto Mono", monospace',
                    fontWeight: val > 0 ? 700 : 400,
                    fontSize: '0.75rem',
                    color: i === 2 && val > 0 ? '#1b5e20' : i === 3 && val > 0 ? '#1565c0' : val > 0 ? 'text.primary' : 'text.disabled',
                  }}>
                    {val}
                  </Typography>
                </Box>
              ))}
            </Box>
          );
        })}

        {/* 이닝 합계 행 */}
        <Box sx={{ display: 'flex', borderTop: '2px solid #0d1b3e', bgcolor: '#f8fafc' }}>
          <Box sx={{
            width: HEADER_W, minWidth: HEADER_W, flexShrink: 0,
            px: 1, py: 0.75,
            borderRight: '2px solid #e2e8f0',
          }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'text.secondary' }}>득점</Typography>
            <Typography sx={{ fontSize: '0.6rem', color: 'text.disabled' }}>안타</Typography>
          </Box>
          {innings.map(inn => (
            <Box key={inn} sx={{
              width: CELL_W, minWidth: CELL_W, flexShrink: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              borderLeft: '1px solid #e2e8f0', py: 0.5,
              bgcolor: inningStats[inn].runs > 0 ? '#f0fdf4' : 'transparent',
            }}>
              <Typography sx={{
                fontFamily: '"Roboto Mono", monospace', fontWeight: 800,
                fontSize: '0.9rem', lineHeight: 1,
                color: inningStats[inn].runs > 0 ? '#1b5e20' : 'text.disabled',
              }}>
                {inningStats[inn].runs}
              </Typography>
              <Typography sx={{
                fontFamily: '"Roboto Mono", monospace', fontSize: '0.6rem',
                color: inningStats[inn].hits > 0 ? '#1565c0' : 'text.disabled',
              }}>
                {inningStats[inn].hits}H
              </Typography>
            </Box>
          ))}
          {/* 총합 */}
          {[null, null, totalHits, totalRuns, null].map((val, i) => (
            <Box key={i} sx={{
              width: 36, minWidth: 36, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderLeft: i === 0 ? '2px solid #e2e8f0' : '1px solid #f0f0f0',
            }}>
              {val != null && (
                <Typography sx={{
                  fontFamily: '"Roboto Mono", monospace', fontWeight: 800, fontSize: '0.75rem',
                  color: i === 2 ? '#1b5e20' : i === 3 ? '#1565c0' : 'text.primary',
                }}>
                  {val}
                </Typography>
              )}
            </Box>
          ))}
        </Box>

        {/* 범례 */}
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', p: 1.5, borderTop: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
          {[
            { label: '안타', color: RESULT_TYPE_COLORS.hit },
            { label: '아웃', color: RESULT_TYPE_COLORS.out },
            { label: '출루', color: RESULT_TYPE_COLORS.onBase },
            { label: '희생', color: RESULT_TYPE_COLORS.sacrifice },
          ].map(item => (
            <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: item.color.bg, border: `1.5px solid ${item.color.border}` }} />
              <Typography variant="caption" sx={{ color: item.color.text, fontWeight: 600, fontSize: '0.6rem' }}>
                {item.label}
              </Typography>
            </Box>
          ))}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#1b5e20' }} />
            <Typography variant="caption" sx={{ color: '#1b5e20', fontWeight: 600, fontSize: '0.6rem' }}>득점(좌상)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, fontSize: '0.6rem', fontFamily: '"Roboto Mono", monospace' }}>우하=투구수</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
