import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Fab from '@mui/material/Fab';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import EditIcon from '@mui/icons-material/Edit';

import {
  getGame, getPlayers, getInningEvents,
  addAtBat, updateAtBat, deleteAtBat,
  getPitching,
} from '../api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import GameInfoCard from '../components/game/GameInfoCard.jsx';
import RunnerEventDialog, { BASE_LABELS } from '../components/game/RunnerEventDialog.jsx';
import EnhancedAtBatModal from '../components/scorecard/EnhancedAtBatModal.jsx';
import InningEventsTab from '../components/scorecard/InningEventsTab.jsx';
import ScoreCardGrid from '../components/scorecard/ScoreCardGrid.jsx';
import PitchingTab from '../components/game/PitchingTab.jsx';
import { RESULT_CODES, RESULT_TYPE_COLORS, HIT_TYPES, FIELDER_POSITIONS, INNING_EVENT_TYPES } from '../utils/constants.js';
import { getEffectiveLineup } from '../utils/lineup.js';

// ─── 공통 배지 ────────────────────────────────────────────────────────────────

function ResultBadge({ result }) {
  const info = RESULT_CODES[result];
  const colors = RESULT_TYPE_COLORS[info?.type] || RESULT_TYPE_COLORS.sacrifice;
  return (
    <Box sx={{
      px: 0.75, py: 0.2, borderRadius: 1,
      bgcolor: colors.bg, border: `1.5px solid ${colors.border}`,
      display: 'inline-flex', alignItems: 'center',
    }}>
      <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 800, fontSize: '0.75rem', color: colors.text, lineHeight: 1 }}>
        {result}
      </Typography>
    </Box>
  );
}

function AtBatDetailBadge({ ab }) {
  const hitType = ab.hitType ? HIT_TYPES.find(h => h.code === ab.hitType) : null;
  const fielderStr = ab.fielders?.length > 0 ? ab.fielders.join('-') : null;
  return (
    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.25 }}>
      {hitType && (
        <Typography variant="caption" sx={{ bgcolor: '#f1f5f9', px: 0.5, borderRadius: 0.5, fontSize: '0.6rem', color: '#475569', fontWeight: 700 }}>
          {hitType.code}
        </Typography>
      )}
      {ab.hitDirection && (
        <Typography variant="caption" sx={{ bgcolor: '#f1f5f9', px: 0.5, borderRadius: 0.5, fontSize: '0.6rem', color: '#475569', fontWeight: 700 }}>
          {ab.hitDirection}
        </Typography>
      )}
      {fielderStr && (
        <Typography variant="caption" sx={{ bgcolor: '#e0f2fe', px: 0.5, borderRadius: 0.5, fontSize: '0.6rem', color: '#0369a1', fontWeight: 700, fontFamily: '"Roboto Mono", monospace' }}>
          {fielderStr}
        </Typography>
      )}
      {ab.pitches != null && (
        <Typography variant="caption" sx={{ bgcolor: '#f8fafc', px: 0.5, borderRadius: 0.5, fontSize: '0.6rem', color: '#64748b', fontFamily: '"Roboto Mono", monospace' }}>
          {ab.pitches}구
        </Typography>
      )}
      {ab.isEarnedRun === false && (
        <Typography variant="caption" sx={{ bgcolor: '#fef3c7', px: 0.5, borderRadius: 0.5, fontSize: '0.6rem', color: '#92400e', fontWeight: 700 }}>
          비자책
        </Typography>
      )}
    </Box>
  );
}

// ─── 타석 기록 탭 ─────────────────────────────────────────────────────────────

function AtBatsRecordingTab({ gameId, atBats, setAtBats, game, players, substitutions }) {
  const [selectedInning, setSelectedInning] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAtBat, setEditingAtBat] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [runnerDialogOpen, setRunnerDialogOpen] = useState(false);
  const [runnerAtBat, setRunnerAtBat] = useState(null);

  const maxInning = game?.innings || 9;
  const effectiveLineup = getEffectiveLineup(
    game?.lineup || [],
    substitutions || [],
    selectedInning
  );

  // 현재 이닝 타석들
  const inningAtBats = atBats.filter(ab => ab.inning === selectedInning);

  // 선수 맵
  const playerMap = {};
  for (const p of players) playerMap[p.id || p._id] = p;

  // 타순별 현재 이닝 결과
  const resultByOrder = {};
  for (const ab of inningAtBats) resultByOrder[ab.order] = ab;

  const handlePlayerTap = (entry) => {
    setSelectedPlayer(entry);
    setEditingAtBat(null);
    setModalOpen(true);
  };

  const handleEditAtBat = (ab) => {
    const entry = effectiveLineup.find(e => e.playerId === ab.playerId) || { playerId: ab.playerId, battingOrder: ab.order };
    setSelectedPlayer(entry);
    setEditingAtBat(ab);
    setModalOpen(true);
  };

  const handleConfirm = async (data) => {
    try {
      if (editingAtBat) {
        const res = await updateAtBat(gameId, editingAtBat.id, data);
        const updated = res.data;
        setAtBats(prev => prev.map(ab => ab.id === editingAtBat.id ? updated : ab));
      } else {
        const res = await addAtBat(gameId, {
          ...data,
          playerId: selectedPlayer.playerId,
          order: selectedPlayer.battingOrder,
          inning: selectedInning,
        });
        const created = res.data;
        setAtBats(prev => [...prev, created]);
      }
      setModalOpen(false);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDelete = async (ab) => {
    if (!window.confirm('이 타석 기록을 삭제할까요?')) return;
    try {
      await deleteAtBat(gameId, ab.id);
      setAtBats(prev => prev.filter(a => a.id !== ab.id));
    } catch (e) {
      alert(e.message);
    }
  };

  const handleRunnerDialog = (ab) => {
    setRunnerAtBat(ab);
    setRunnerDialogOpen(true);
  };

  const handleRunnerSaved = (updatedAtBat) => {
    setAtBats(prev => prev.map(ab => ab.id === updatedAtBat.id ? updatedAtBat : ab));
  };

  // 총 득점/안타 수
  const totalRuns = atBats.reduce((sum, ab) => sum + (ab.run || 0), 0);
  const totalHits = atBats.filter(ab => ['1H', '2H', '3H', 'HR'].includes(ab.result)).length;

  return (
    <Box sx={{ pb: 10 }}>
      {/* 스코어 요약 */}
      <Box sx={{ px: 2, pt: 1.5, pb: 1, display: 'flex', gap: 2 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>총 득점</Typography>
          <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 800, fontSize: '1.5rem', color: '#1b5e20' }}>
            {totalRuns}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>총 안타</Typography>
          <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 800, fontSize: '1.5rem', color: '#1565c0' }}>
            {totalHits}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>총 타석</Typography>
          <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 800, fontSize: '1.5rem', color: 'text.primary' }}>
            {atBats.length}
          </Typography>
        </Box>
      </Box>

      {/* 이닝 선택 */}
      <Box sx={{ px: 2, pb: 1.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.75, display: 'block' }}>이닝 선택</Typography>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {Array.from({ length: maxInning }, (_, i) => i + 1).map(n => {
            const inningRuns = atBats.filter(ab => ab.inning === n).reduce((s, ab) => s + (ab.run || 0), 0);
            return (
              <Chip
                key={n}
                label={inningRuns > 0 ? `${n}회 (${inningRuns})` : `${n}회`}
                size="small"
                onClick={() => setSelectedInning(n)}
                color={selectedInning === n ? 'primary' : 'default'}
                sx={{
                  fontWeight: 700, cursor: 'pointer', minWidth: 48, height: 30,
                  bgcolor: selectedInning === n ? undefined : inningRuns > 0 ? '#f0fdf4' : undefined,
                  color: selectedInning !== n && inningRuns > 0 ? '#1b5e20' : undefined,
                }}
              />
            );
          })}
        </Box>
      </Box>

      <Divider />

      {/* {selectedInning}회 선수 목록 */}
      <Box sx={{ px: 2, pt: 1.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1, display: 'block' }}>
          {selectedInning}회 타석
        </Typography>
        {effectiveLineup.length === 0 && (
          <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 2 }}>
            라인업이 등록되지 않았습니다
          </Typography>
        )}
        {effectiveLineup.map(entry => {
          const player = playerMap[entry.playerId];
          const currentAb = resultByOrder[entry.battingOrder];
          return (
            <Box
              key={entry.playerId}
              sx={{
                display: 'flex', alignItems: 'flex-start', gap: 1,
                py: 1, borderBottom: '1px solid #f1f5f9',
              }}
            >
              {/* 타순 */}
              <Box sx={{
                width: 28, height: 28, borderRadius: '50%',
                bgcolor: currentAb ? '#0d1b3e' : '#f1f5f9',
                color: currentAb ? '#fff' : '#94a3b8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, mt: 0.25,
              }}>
                <Typography sx={{ fontWeight: 800, fontSize: '0.75rem', fontFamily: '"Roboto Mono", monospace' }}>
                  {entry.battingOrder}
                </Typography>
              </Box>

              {/* 선수 정보 + 결과 */}
              <Box
                sx={{ flex: 1, cursor: 'pointer', '&:active': { opacity: 0.7 } }}
                onClick={() => handlePlayerTap(entry)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {player?.name || entry.playerId}
                  </Typography>
                  {player?.number && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: '"Roboto Mono", monospace' }}>
                      #{player.number}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">{entry.position}</Typography>
                  {currentAb && <ResultBadge result={currentAb.result} />}
                </Box>
                {currentAb && <AtBatDetailBadge ab={currentAb} />}
                {currentAb?.note && (
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>{currentAb.note}</Typography>
                )}
                {!currentAb && (
                  <Typography variant="caption" color="text.disabled">탭하여 타석 기록</Typography>
                )}
              </Box>

              {/* 액션 버튼 */}
              {currentAb && (
                <Box sx={{ display: 'flex', gap: 0, flexShrink: 0 }}>
                  <IconButton size="small" onClick={() => handleRunnerDialog(currentAb)} title="주루 기록">
                    <DirectionsRunIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleEditAtBat(currentAb)} title="수정">
                    <EditIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(currentAb)} title="삭제">
                    <DeleteIcon sx={{ fontSize: 16, color: 'error.light' }} />
                  </IconButton>
                </Box>
              )}
              {!currentAb && (
                <IconButton size="small" onClick={() => handlePlayerTap(entry)} title="기록 추가">
                  <AddIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                </IconButton>
              )}
            </Box>
          );
        })}
      </Box>

      {/* 이닝 합계 */}
      {inningAtBats.length > 0 && (
        <Box sx={{ mx: 2, mt: 1.5, p: 1.5, bgcolor: '#f0f4ff', borderRadius: 2 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#0d1b3e', mb: 0.75, display: 'block' }}>
            {selectedInning}회 합계
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {[
              { label: '득점', val: inningAtBats.reduce((s, ab) => s + (ab.run || 0), 0), color: '#1b5e20' },
              { label: '안타', val: inningAtBats.filter(ab => ['1H', '2H', '3H', 'HR'].includes(ab.result)).length, color: '#1565c0' },
              { label: '타점', val: inningAtBats.reduce((s, ab) => s + (ab.rbi || 0), 0), color: '#7c3aed' },
              { label: '투구수', val: inningAtBats.reduce((s, ab) => s + (ab.pitches || 0), 0), color: '#475569' },
            ].map(item => (
              <Box key={item.label} sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, fontSize: '0.6rem' }}>
                  {item.label}
                </Typography>
                <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 800, fontSize: '1rem', color: item.color }}>
                  {item.val}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* 주루 기록 다이얼로그 */}
      <RunnerEventDialog
        open={runnerDialogOpen}
        onClose={() => setRunnerDialogOpen(false)}
        atBat={runnerAtBat}
        gameId={gameId}
        players={players}
        lineup={game?.lineup}
        onSaved={handleRunnerSaved}
      />

      {/* 타석 입력 모달 */}
      <EnhancedAtBatModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirm}
        playerName={selectedPlayer ? (playerMap[selectedPlayer.playerId]?.name || selectedPlayer.playerId) : ''}
        inning={selectedInning}
        maxInning={maxInning}
        initialInning={selectedInning}
        initialData={editingAtBat}
      />
    </Box>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────────

export default function ScorecardPage() {
  const { id } = useParams();

  const [tab, setTab] = useState(0);
  const [game, setGame] = useState(null);
  const [players, setPlayers] = useState([]);
  const [atBats, setAtBats] = useState([]);
  const [inningEvents, setInningEvents] = useState([]);
  const [pitchingRecords, setPitchingRecords] = useState([]);
  const [substitutions, setSubstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      getGame(id),
      getPlayers(),
      getInningEvents(id).catch(() => ({ data: [] })),
      getPitching(id).catch(() => ({ data: [] })),
    ])
      .then(([gameRes, playersRes, eventsRes, pitchingRes]) => {
        const g = gameRes.data || gameRes;
        setGame(g);
        setAtBats(g.atBats || []);
        setSubstitutions(g.substitutions || []);
        setPlayers(playersRes.data || []);
        setInningEvents(eventsRes.data || []);
        setPitchingRecords(pitchingRes.records || pitchingRes.data || []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (error) return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Typography color="error">{error}</Typography>
    </Box>
  );
  if (!game) return null;

  const ourScore = atBats.reduce((sum, ab) => sum + (ab.run || 0), 0);
  const maxInning = game.innings || 9;

  // 이닝별 스코어 바 (상단 표시용)
  const inningScores = Array.from({ length: maxInning }, (_, i) => {
    const inn = i + 1;
    return atBats.filter(ab => ab.inning === inn).reduce((s, ab) => s + (ab.run || 0), 0);
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 경기 정보 + 이닝 스코어 */}
      <Box sx={{ px: 2, pt: 1.5 }}>
        {/* 경기 제목 */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              vs {game.opponent}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {game.date} {game.venue ? `· ${game.venue}` : ''}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 900, fontSize: '1.75rem', lineHeight: 1, color: '#0d1b3e' }}>
              {ourScore}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              우리 팀 득점
            </Typography>
          </Box>
        </Box>

        {/* 이닝별 득점 표 */}
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 0,
          bgcolor: '#0d1b3e', borderRadius: 1.5, overflow: 'hidden', mb: 1.5,
        }}>
          <Box sx={{ px: 1, py: 0.5, borderRight: '1px solid rgba(255,255,255,0.2)' }}>
            <Typography sx={{ color: '#fff', fontSize: '0.65rem', fontWeight: 700, opacity: 0.7 }}>팀원</Typography>
          </Box>
          {inningScores.map((runs, i) => (
            <Box key={i} sx={{
              flex: 1, textAlign: 'center', py: 0.5, px: 0.25,
              borderRight: i < inningScores.length - 1 ? '1px solid rgba(255,255,255,0.15)' : 'none',
              bgcolor: runs > 0 ? 'rgba(29,219,84,0.15)' : 'transparent',
            }}>
              <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: runs > 0 ? 800 : 400, fontSize: '0.85rem', color: runs > 0 ? '#4ade80' : 'rgba(255,255,255,0.5)', lineHeight: 1 }}>
                {runs}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.5rem', lineHeight: 1 }}>{i + 1}</Typography>
            </Box>
          ))}
          <Box sx={{ px: 1, py: 0.5, borderLeft: '2px solid rgba(255,255,255,0.3)', minWidth: 32, textAlign: 'center' }}>
            <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 900, fontSize: '0.95rem', color: '#fff', lineHeight: 1 }}>
              {ourScore}
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.5rem', lineHeight: 1 }}>R</Typography>
          </Box>
        </Box>
      </Box>

      {/* 탭 네비게이션 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons={false}
          sx={{ minHeight: 42 }}
        >
          <Tab label="타석 기록" sx={{ minHeight: 42, fontSize: '0.78rem', fontWeight: 700, px: 1.5 }} />
          <Tab
            label={`이닝 이벤트${inningEvents.length > 0 ? ` (${inningEvents.length})` : ''}`}
            sx={{ minHeight: 42, fontSize: '0.78rem', fontWeight: 700, px: 1.5 }}
          />
          <Tab label="스코어카드" sx={{ minHeight: 42, fontSize: '0.78rem', fontWeight: 700, px: 1.5 }} />
          <Tab label="투구 기록" sx={{ minHeight: 42, fontSize: '0.78rem', fontWeight: 700, px: 1.5 }} />
        </Tabs>
      </Box>

      {/* 탭 콘텐츠 */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {tab === 0 && (
          <AtBatsRecordingTab
            gameId={id}
            atBats={atBats}
            setAtBats={setAtBats}
            game={game}
            players={players}
            substitutions={substitutions}
          />
        )}

        {tab === 1 && (
          <InningEventsTab
            gameId={id}
            events={inningEvents}
            setEvents={setInningEvents}
            players={players}
            maxInning={maxInning}
          />
        )}

        {tab === 2 && (
          <Box>
            <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
                전통 스코어카드
              </Typography>
              <Typography variant="caption" color="text.disabled">
                셀을 탭하면 상세 정보가 표시됩니다 · 수비수: 포지션 번호
              </Typography>
            </Box>
            <ScoreCardGrid
              atBats={atBats}
              players={players}
              lineup={game.lineup}
              maxInning={maxInning}
            />
          </Box>
        )}

        {tab === 3 && (
          <Box sx={{ px: 0 }}>
            <PitchingTab
              gameId={id}
              game={game}
              players={players}
              pitchingRecords={pitchingRecords}
              opponentAtBats={[]}
              onPitchingAdded={(r) => setPitchingRecords(prev => [...prev, r])}
              onPitchingDeleted={(rId) => setPitchingRecords(prev => prev.filter(r => r.id !== rId))}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
