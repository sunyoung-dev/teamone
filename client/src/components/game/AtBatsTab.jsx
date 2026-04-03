import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import { addAtBat, deleteAtBat } from '../../api.js';
import AtBatPicker from '../AtBatPicker.jsx';
import RunnerEventDialog, { BASE_LABELS } from './RunnerEventDialog.jsx';
import { RESULT_CODES, RESULT_TYPE_COLORS } from '../../utils/constants.js';
import { getEffectiveLineup } from '../../utils/lineup.js';

function ResultBadge({ result }) {
  const info = RESULT_CODES[result];
  const colors = RESULT_TYPE_COLORS[info?.type] || RESULT_TYPE_COLORS.sacrifice;
  return (
    <Box
      sx={{
        px: 0.75, py: 0.25, borderRadius: 1,
        bgcolor: colors.bg, border: `1.5px solid ${colors.border}`,
        display: 'inline-flex', alignItems: 'center',
      }}
    >
      <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 800, fontSize: '0.75rem', color: colors.text, lineHeight: 1 }}>
        {result}
      </Typography>
    </Box>
  );
}

function BallCountBadge({ balls, strikes, fouls, pitches, result }) {
  const hasBalls = balls != null;
  const hasStrikes = strikes != null;
  if (!hasBalls && !hasStrikes && result !== 'HBP') return null;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
      {result === 'HBP' ? (
        <Typography variant="caption" sx={{ color: 'text.disabled', fontFamily: '"Roboto Mono", monospace' }}>1구</Typography>
      ) : (
        <>
          {/* 볼 도트 */}
          <Box sx={{ display: 'flex', gap: 0.3 }}>
            {Array.from({ length: 3 }, (_, i) => (
              <Box key={i} sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: i < (balls ?? 0) ? '#1565c0' : '#dbeafe' }} />
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 0.3 }}>
            {Array.from({ length: 2 }, (_, i) => (
              <Box key={i} sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: i < (strikes ?? 0) ? '#b71c1c' : '#fee2e2' }} />
            ))}
          </Box>
          {fouls > 0 && (
            <Typography variant="caption" sx={{ color: 'text.disabled', fontFamily: '"Roboto Mono", monospace', fontSize: '0.65rem' }}>
              F{fouls}
            </Typography>
          )}
          {pitches != null && (
            <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: '"Roboto Mono", monospace', fontWeight: 700, fontSize: '0.65rem' }}>
              {pitches}구
            </Typography>
          )}
        </>
      )}
    </Box>
  );
}

function RunnerEventsBadge({ events }) {
  if (!events?.length) return null;
  return (
    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
      {events.map((ev, i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
          <DirectionsRunIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
          <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
            {ev.runnerName}
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.disabled' }}>
            {BASE_LABELS[ev.fromBase]}→
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.65rem', fontWeight: 700,
              color: ev.toBase === 4 ? 'success.main' : ev.toBase === 0 ? 'error.main' : 'text.secondary',
            }}
          >
            {BASE_LABELS[ev.toBase]}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function AtBatRow({ atBat, player, onDelete, onRunnerEdit }) {
  const info = RESULT_CODES[atBat.result];
  const colors = RESULT_TYPE_COLORS[info?.type] || RESULT_TYPE_COLORS.sacrifice;
  return (
    <ListItem
      sx={{ py: 1, px: 2 }}
      secondaryAction={
        <Box sx={{ display: 'flex', gap: 0.25 }}>
          <IconButton size="small" onClick={() => onRunnerEdit(atBat)} aria-label="주루 기록" color="primary">
            <DirectionsRunIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => onDelete(atBat.id)} aria-label="삭제" color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      }
    >
      <Box
        sx={{
          width: 44, height: 44, borderRadius: 1.5, mr: 1.5,
          bgcolor: colors.bg, border: `2px solid ${colors.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}
      >
        <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 800, fontSize: '0.85rem', color: colors.text }}>
          {atBat.result}
        </Typography>
      </Box>
      <ListItemText
        primary={
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{player?.name ?? atBat.playerId}</Typography>
        }
        secondary={
          <Box component="span">
            <Typography variant="caption" color="text.secondary" component="span">
              {info?.label ?? atBat.result}{atBat.note ? ` · ${atBat.note}` : ''}{atBat.rbi > 0 ? ` · 타점 ${atBat.rbi}` : ''}
            </Typography>
            <BallCountBadge
              balls={atBat.balls} strikes={atBat.strikes}
              fouls={atBat.fouls} pitches={atBat.pitches}
              result={atBat.result}
            />
            <RunnerEventsBadge events={atBat.runnerEvents} />
          </Box>
        }
      />
    </ListItem>
  );
}

export default function AtBatsTab({ gameId, game, players, atBats, substitutions, onAtBatAdded, onAtBatDeleted, onAtBatUpdated }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedInning, setSelectedInning] = useState(1);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [runnerDialogAtBat, setRunnerDialogAtBat] = useState(null);

  const playerMap = Object.fromEntries((players || []).map((p) => [p.id, p]));
  const maxInning = game?.innings || 9;

  const originalLineup = game?.lineup || [];
  const effectiveLineupEntries = getEffectiveLineup(originalLineup, substitutions || [], selectedInning)
    .sort((a, b) => a.battingOrder - b.battingOrder)
    .map((entry) => ({ ...entry, player: playerMap[entry.playerId] }))
    .filter((e) => e.player);

  const subsThisInning = new Set(
    (substitutions || [])
      .filter((s) => !s.isOpponent && s.inning === selectedInning)
      .map((s) => s.inPlayerId)
  );

  const inningAtBats = atBats.filter((ab) => ab.inning === selectedInning);

  const playerInningResults = {};
  inningAtBats.forEach((ab) => {
    if (!playerInningResults[ab.playerId]) playerInningResults[ab.playerId] = [];
    playerInningResults[ab.playerId].push(ab);
  });

  const handlePlayerTap = (playerId) => {
    setSelectedPlayerId(playerId);
    setPickerOpen(true);
  };

  const handlePickerConfirm = async ({ result, inning, note, balls, strikes, fouls, pitches }) => {
    const nextOrder = (atBats.filter((ab) => ab.inning === inning).length) + 1;
    const newAtBat = { inning, playerId: selectedPlayerId, result, order: nextOrder, rbi: 0, run: 0, note: note || '', balls: balls ?? null, strikes: strikes ?? null, fouls: fouls ?? 0, pitches: pitches ?? null };
    try {
      const res = await addAtBat(gameId, newAtBat);
      onAtBatAdded(res.data || { ...newAtBat, id: Date.now().toString() });
    } catch (e) {
      console.error(e);
    }
    setPickerOpen(false);
  };

  const handleDelete = async (atBatId) => {
    try {
      await deleteAtBat(gameId, atBatId);
      onAtBatDeleted(atBatId);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 0.75, p: 2, pb: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mr: 0.5 }}>이닝</Typography>
        {Array.from({ length: maxInning }, (_, i) => i + 1).map((n) => (
          <Chip
            key={n}
            label={`${n}회`}
            size="small"
            onClick={() => setSelectedInning(n)}
            color={selectedInning === n ? 'primary' : 'default'}
            sx={{ fontWeight: 700, cursor: 'pointer', minWidth: 44, height: 32 }}
          />
        ))}
      </Box>

      <Divider />

      {effectiveLineupEntries.length > 0 ? (
        <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1, display: 'block' }}>
            타자 선택 후 결과 입력
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {effectiveLineupEntries.map((entry) => {
              const results = playerInningResults[entry.playerId] || [];
              const isSelected = selectedPlayerId === entry.playerId;
              const isSubIn = subsThisInning.has(entry.playerId);
              return (
                <Box
                  key={entry.playerId}
                  onClick={() => handlePlayerTap(entry.playerId)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    px: 1.5, py: 1.25, borderRadius: 2, cursor: 'pointer',
                    border: '1.5px solid',
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    bgcolor: isSelected ? 'primary.main' : 'background.paper',
                    color: isSelected ? 'primary.contrastText' : 'text.primary',
                    transition: 'all 0.15s',
                    '&:active': { opacity: 0.75 },
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: '"Roboto Mono", monospace', fontWeight: 800,
                      fontSize: '1.1rem', minWidth: 24, textAlign: 'center',
                      color: isSelected ? 'rgba(255,255,255,0.8)' : 'primary.main',
                    }}
                  >
                    {entry.battingOrder}
                  </Typography>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                        {entry.player.name}
                      </Typography>
                      {isSubIn && (
                        <Chip
                          label="교체"
                          size="small"
                          color="secondary"
                          sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, '& .MuiChip-label': { px: 0.5 } }}
                        />
                      )}
                    </Box>
                    <Typography variant="caption" sx={{ opacity: 0.7, lineHeight: 1 }}>
                      #{entry.player.number} · {entry.position}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 120 }}>
                    {results.map((ab, i) => (
                      <ResultBadge key={i} result={ab.result} />
                    ))}
                    {results.length === 0 && (
                      <Typography variant="caption" sx={{ opacity: 0.45 }}>-</Typography>
                    )}
                  </Box>
                  <AddIcon sx={{ fontSize: 18, opacity: 0.6, flexShrink: 0 }} />
                </Box>
              );
            })}
          </Box>
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">라인업을 먼저 등록하세요</Typography>
        </Box>
      )}

      <Divider sx={{ mt: 1 }} />

      <Box sx={{ px: 2, pt: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
          {selectedInning}회 기록 ({inningAtBats.length}타석)
        </Typography>
      </Box>
      {inningAtBats.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body2" color="text.secondary">아직 기록이 없어요</Typography>
        </Box>
      ) : (
        <List dense disablePadding>
          {inningAtBats.map((ab, idx) => (
            <React.Fragment key={ab.id || idx}>
              <AtBatRow
                atBat={ab}
                player={playerMap[ab.playerId]}
                onDelete={handleDelete}
                onRunnerEdit={setRunnerDialogAtBat}
              />
              {idx < inningAtBats.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}

      <AtBatPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onConfirm={handlePickerConfirm}
        playerName={playerMap[selectedPlayerId]?.name}
        inning={selectedInning}
        maxInning={maxInning}
      />

      <RunnerEventDialog
        open={!!runnerDialogAtBat}
        onClose={() => setRunnerDialogAtBat(null)}
        atBat={runnerDialogAtBat}
        gameId={gameId}
        players={players}
        lineup={originalLineup}
        onSaved={(updated) => {
          onAtBatUpdated?.(updated);
          setRunnerDialogAtBat(null);
        }}
      />
    </Box>
  );
}
