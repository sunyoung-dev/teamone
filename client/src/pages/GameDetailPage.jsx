import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import {
  getGame, getAtBats, addAtBat, deleteAtBat, getPlayers, updateGame,
  getOpponentAtBats, addOpponentAtBat, deleteOpponentAtBat,
  getOpponentLineup, updateOpponentLineup,
  getPitching, addPitching, deletePitching,
  getSubstitutions, addSubstitution, deleteSubstitution,
} from '../api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ScoreChip from '../components/ScoreChip.jsx';
import AtBatPicker from '../components/AtBatPicker.jsx';
import OpponentAtBatPicker from '../components/OpponentAtBatPicker.jsx';
import { RESULT_CODES, RESULT_TYPE_COLORS, POSITION_MAP, POSITIONS } from '../utils/constants.js';
import { getEffectiveLineup, getEffectiveOpponentLineup } from '../utils/lineup.js';

// ─── GameInfoCard ─────────────────────────────────────────────────────────────

function GameInfoCard({ game, ourScore }) {
  const isFinal = game.status === 'final';
  const isInProgress = game.status === 'in_progress';
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>vs {game.opponent}</Typography>
          <ScoreChip result={game.result} size="medium" />
        </Box>
        <Box sx={{ display: 'flex', gap: 3, mb: 0.5 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">날짜</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{game.date}</Typography>
          </Box>
          {game.venue && (
            <Box>
              <Typography variant="caption" color="text.secondary">장소</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{game.venue}</Typography>
            </Box>
          )}
          {(isFinal || isInProgress) && (
            <Box>
              <Typography variant="caption" color="text.secondary">스코어</Typography>
              <Typography variant="body2" sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 700 }}>
                {isFinal ? game.scoreOurs : ourScore} : {isFinal ? game.scoreTheirs : '?'}
              </Typography>
            </Box>
          )}
        </Box>
        <Chip
          label={isFinal ? '종료' : isInProgress ? '진행중' : '예정'}
          size="small"
          color={isInProgress ? 'secondary' : 'default'}
          sx={{ mt: 0.5 }}
        />
      </CardContent>
    </Card>
  );
}

// ─── SubstitutionDialog ───────────────────────────────────────────────────────

function SubstitutionDialog({ open, onClose, onConfirm, game, players, substitutions }) {
  const maxInning = game?.innings || 9;
  const [inning, setInning] = useState(1);
  const [isOpponent, setIsOpponent] = useState(false);

  // Our team fields
  const [outPlayerId, setOutPlayerId] = useState('');
  const [inPlayerId, setInPlayerId] = useState('');

  // Opponent fields
  const [outPlayerName, setOutPlayerName] = useState('');
  const [inPlayerName, setInPlayerName] = useState('');
  const [inPlayerNumber, setInPlayerNumber] = useState('');
  const [battingOrder, setBattingOrder] = useState('');

  const [position, setPosition] = useState('');
  const [saving, setSaving] = useState(false);

  const playerMap = Object.fromEntries((players || []).map((p) => [p.id, p]));

  // Effective our-team lineup for the selected inning
  const originalLineup = game?.lineup || [];
  const effectiveLineup = getEffectiveLineup(originalLineup, substitutions, inning)
    .sort((a, b) => a.battingOrder - b.battingOrder)
    .map((e) => ({ ...e, player: playerMap[e.playerId] }))
    .filter((e) => e.player);

  const effectivePlayerIds = new Set(effectiveLineup.map((e) => e.playerId));
  const allPlayerIds = new Set(originalLineup.map((e) => e.playerId));

  // Players available to sub in = all players not currently in the effective lineup
  const availableInPlayers = (players || []).filter((p) => !effectivePlayerIds.has(p.id));

  const handleClose = () => {
    setInning(1);
    setIsOpponent(false);
    setOutPlayerId('');
    setInPlayerId('');
    setOutPlayerName('');
    setInPlayerName('');
    setInPlayerNumber('');
    setBattingOrder('');
    setPosition('');
    onClose();
  };

  const canConfirm = isOpponent
    ? outPlayerName.trim() && inPlayerName.trim() && battingOrder !== ''
    : outPlayerId && inPlayerId;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setSaving(true);
    try {
      const data = isOpponent
        ? {
            inning,
            isOpponent: true,
            battingOrder: Number(battingOrder),
            outPlayerName: outPlayerName.trim(),
            inPlayerName: inPlayerName.trim(),
            inPlayerNumber: inPlayerNumber.trim(),
            position,
          }
        : {
            inning,
            isOpponent: false,
            outPlayerId,
            inPlayerId,
            position,
            battingOrder: effectiveLineup.find((e) => e.playerId === outPlayerId)?.battingOrder || 0,
          };
      await onConfirm(data);
      handleClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth PaperProps={{ sx: { mx: 2, borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>선수 교체 추가</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>

          {/* Inning selector */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.75, display: 'block' }}>이닝</Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {Array.from({ length: maxInning }, (_, i) => i + 1).map((n) => (
                <Chip
                  key={n}
                  label={`${n}회`}
                  size="small"
                  onClick={() => setInning(n)}
                  color={inning === n ? 'primary' : 'default'}
                  sx={{ fontWeight: 700, cursor: 'pointer', minWidth: 40, height: 28 }}
                />
              ))}
            </Box>
          </Box>

          {/* Team toggle */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.75, display: 'block' }}>교체 유형</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label="우리팀"
                onClick={() => setIsOpponent(false)}
                color={!isOpponent ? 'primary' : 'default'}
                sx={{ fontWeight: 700, cursor: 'pointer' }}
              />
              <Chip
                label="상대팀"
                onClick={() => setIsOpponent(true)}
                color={isOpponent ? 'secondary' : 'default'}
                sx={{ fontWeight: 700, cursor: 'pointer' }}
              />
            </Box>
          </Box>

          {!isOpponent ? (
            <>
              <FormControl size="small" fullWidth>
                <InputLabel>나가는 선수</InputLabel>
                <Select value={outPlayerId} label="나가는 선수" onChange={(e) => setOutPlayerId(e.target.value)}>
                  <MenuItem value=""><em>선택</em></MenuItem>
                  {effectiveLineup.map((e) => (
                    <MenuItem key={e.playerId} value={e.playerId}>
                      {e.battingOrder}번 · #{e.player.number} {e.player.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>들어오는 선수</InputLabel>
                <Select value={inPlayerId} label="들어오는 선수" onChange={(e) => setInPlayerId(e.target.value)}>
                  <MenuItem value=""><em>선택</em></MenuItem>
                  {availableInPlayers.map((p) => (
                    <MenuItem key={p.id} value={p.id}>#{p.number} {p.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          ) : (
            <>
              <TextField
                label="타순"
                type="number"
                value={battingOrder}
                onChange={(e) => setBattingOrder(e.target.value)}
                size="small"
                fullWidth
                inputProps={{ min: 1, max: 20 }}
              />
              <TextField
                label="나가는 선수 이름"
                value={outPlayerName}
                onChange={(e) => setOutPlayerName(e.target.value)}
                size="small"
                fullWidth
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label="들어오는 선수 이름"
                  value={inPlayerName}
                  onChange={(e) => setInPlayerName(e.target.value)}
                  size="small"
                  sx={{ flex: 2 }}
                />
                <TextField
                  label="등번호"
                  value={inPlayerNumber}
                  onChange={(e) => setInPlayerNumber(e.target.value)}
                  size="small"
                  sx={{ flex: 1 }}
                />
              </Box>
            </>
          )}

          {/* Position */}
          <FormControl size="small" fullWidth>
            <InputLabel>포지션</InputLabel>
            <Select value={position} label="포지션" onChange={(e) => setPosition(e.target.value)}>
              <MenuItem value=""><em>없음</em></MenuItem>
              {POSITIONS.map((pos) => (
                <MenuItem key={pos.code} value={pos.code}>{pos.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" sx={{ flex: 1 }}>취소</Button>
        <Button onClick={handleConfirm} variant="contained" disabled={!canConfirm || saving} sx={{ flex: 2 }}>
          {saving ? '저장 중...' : '확인'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── LineupTab ────────────────────────────────────────────────────────────────

function LineupTab({ lineup, players, game, substitutions, onSubstitutionAdded, onSubstitutionDeleted }) {
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const playerMap = Object.fromEntries((players || []).map((p) => [p.id, p]));
  const sorted = [...(lineup || [])].sort((a, b) => a.battingOrder - b.battingOrder);

  const sortedSubs = [...(substitutions || [])].sort((a, b) => a.inning - b.inning);

  const getSubLabel = (sub) => {
    if (sub.isOpponent) {
      return `${sub.inning}회 | ${sub.battingOrder}번 타순 | ${sub.outPlayerName} → ${sub.inPlayerName}${sub.position ? ` (${POSITION_MAP[sub.position] || sub.position})` : ''}`;
    }
    const outPlayer = playerMap[sub.outPlayerId];
    const inPlayer = playerMap[sub.inPlayerId];
    return `${sub.inning}회 | ${sub.battingOrder}번 타순 | ${outPlayer?.name ?? sub.outPlayerId} → ${inPlayer?.name ?? sub.inPlayerId}${sub.position ? ` (${POSITION_MAP[sub.position] || sub.position})` : ''}`;
  };

  return (
    <Box>
      {/* Original lineup table */}
      {sorted.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="body2" color="text.secondary">라인업이 없습니다</Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: 40 }}>타순</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>선수</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>포지션</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.map((entry) => {
                const player = playerMap[entry.playerId];
                return (
                  <TableRow key={entry.playerId} hover>
                    <TableCell>
                      <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 700, color: 'primary.main' }}>
                        {entry.battingOrder}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Typography variant="caption" sx={{ fontFamily: '"Roboto Mono", monospace', color: 'text.secondary', minWidth: 20 }}>
                          #{player?.number ?? '?'}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{player?.name ?? entry.playerId}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={POSITION_MAP[entry.position] || entry.position} size="small" variant="outlined" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Substitution records */}
      <Box sx={{ px: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>선수 교체 기록</Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setSubDialogOpen(true)}
          >
            교체 추가
          </Button>
        </Box>

        {sortedSubs.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
            교체 기록이 없습니다
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {sortedSubs.map((sub) => (
              <Box
                key={sub.id}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1,
                  px: 1.5, py: 1, borderRadius: 1.5,
                  border: '1px solid', borderColor: 'divider',
                  bgcolor: 'background.paper',
                }}
              >
                <Chip
                  label={`${sub.inning}회`}
                  size="small"
                  color={sub.isOpponent ? 'secondary' : 'primary'}
                  sx={{ fontWeight: 700, minWidth: 36, flexShrink: 0 }}
                />
                <Typography variant="body2" sx={{ flex: 1, fontSize: '0.8rem' }}>
                  {getSubLabel(sub)}
                </Typography>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => onSubstitutionDeleted(sub.id)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <SubstitutionDialog
        open={subDialogOpen}
        onClose={() => setSubDialogOpen(false)}
        onConfirm={onSubstitutionAdded}
        game={game}
        players={players}
        substitutions={substitutions}
      />
    </Box>
  );
}

// ─── ResultBadge ──────────────────────────────────────────────────────────────

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

// ─── AtBatRow ─────────────────────────────────────────────────────────────────

function AtBatRow({ atBat, player, onDelete }) {
  const info = RESULT_CODES[atBat.result];
  const colors = RESULT_TYPE_COLORS[info?.type] || RESULT_TYPE_COLORS.sacrifice;
  return (
    <ListItem
      sx={{ py: 1, px: 2 }}
      secondaryAction={
        <IconButton size="small" onClick={() => onDelete(atBat.id)} aria-label="삭제" color="error">
          <DeleteIcon fontSize="small" />
        </IconButton>
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
          <Typography variant="caption" color="text.secondary">
            {info?.label ?? atBat.result}{atBat.note ? ` · ${atBat.note}` : ''}{atBat.rbi > 0 ? ` · 타점 ${atBat.rbi}` : ''}
          </Typography>
        }
      />
    </ListItem>
  );
}

// ─── AtBatsTab ────────────────────────────────────────────────────────────────

function AtBatsTab({ gameId, game, players, atBats, substitutions, onAtBatAdded, onAtBatDeleted }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedInning, setSelectedInning] = useState(1);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');

  const playerMap = Object.fromEntries((players || []).map((p) => [p.id, p]));
  const maxInning = game?.innings || 9;

  // Effective lineup for the selected inning (applies substitutions)
  const originalLineup = game?.lineup || [];
  const effectiveLineupEntries = getEffectiveLineup(originalLineup, substitutions || [], selectedInning)
    .sort((a, b) => a.battingOrder - b.battingOrder)
    .map((entry) => ({ ...entry, player: playerMap[entry.playerId] }))
    .filter((e) => e.player);

  // Players who entered via substitution this inning
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

  const handlePickerConfirm = async ({ result, inning, rbi, run, note }) => {
    const nextOrder = (atBats.filter((ab) => ab.inning === inning).length) + 1;
    const newAtBat = { inning, playerId: selectedPlayerId, result, order: nextOrder, rbi: rbi || 0, run: run || 0, note: note || '' };
    try {
      const res = await addAtBat(gameId, newAtBat);
      onAtBatAdded(res.atBat || { ...newAtBat, id: Date.now().toString() });
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
              <AtBatRow atBat={ab} player={playerMap[ab.playerId]} onDelete={handleDelete} />
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
    </Box>
  );
}

// ─── OpponentTab ──────────────────────────────────────────────────────────────

function OpponentTab({ gameId, game, players, opponentAtBats, substitutions, onOpponentAtBatAdded, onOpponentAtBatDeleted }) {
  const maxInning = game?.innings || 9;

  // Opponent lineup state (loaded from server)
  const [opponentLineup, setOpponentLineup] = useState([]);
  const [lineupLoading, setLineupLoading] = useState(true);

  // Add batter form
  const [batterOrder, setBatterOrder] = useState('');
  const [batterName, setBatterName] = useState('');
  const [batterNumber, setBatterNumber] = useState('');
  const [batterPosition, setBatterPosition] = useState('');
  const [addingBatter, setAddingBatter] = useState(false);

  // Edit batter dialog
  const [editBatter, setEditBatter] = useState(null);
  const [editOrder, setEditOrder] = useState('');
  const [editName, setEditName] = useState('');
  const [editNumber, setEditNumber] = useState('');
  const [editPosition, setEditPosition] = useState('');

  // At-bat recording
  const [selectedInning, setSelectedInning] = useState(1);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedBatter, setSelectedBatter] = useState(null);

  // Our team pitchers (position P in lineup, or all players as fallback)
  const pitcherOptions = React.useMemo(() => {
    const lineupPitchers = (game?.lineup || []).filter((e) => e.position === 'P');
    if (lineupPitchers.length > 0) {
      const playerMap = Object.fromEntries((players || []).map((p) => [p.id, p]));
      return lineupPitchers.map((e) => playerMap[e.playerId]).filter(Boolean);
    }
    return players || [];
  }, [game, players]);

  useEffect(() => {
    getOpponentLineup(gameId)
      .then((res) => setOpponentLineup(res.data || []))
      .catch(() => setOpponentLineup([]))
      .finally(() => setLineupLoading(false));
  }, [gameId]);

  const saveLineup = useCallback(async (newLineup) => {
    setOpponentLineup(newLineup);
    try {
      await updateOpponentLineup(gameId, newLineup);
    } catch (e) {
      console.error(e);
    }
  }, [gameId]);

  const handleAddBatter = async () => {
    if (!batterName.trim()) return;
    setAddingBatter(true);
    const newBatter = {
      id: Date.now().toString(),
      order: Number(batterOrder) || opponentLineup.length + 1,
      name: batterName.trim(),
      number: batterNumber.trim(),
      position: batterPosition,
    };
    const updated = [...opponentLineup, newBatter].sort((a, b) => a.order - b.order);
    await saveLineup(updated);
    setBatterOrder('');
    setBatterName('');
    setBatterNumber('');
    setBatterPosition('');
    setAddingBatter(false);
  };

  const handleDeleteBatter = async (batterId) => {
    const updated = opponentLineup.filter((b) => b.id !== batterId);
    await saveLineup(updated);
  };

  const openEditBatter = (batter) => {
    setEditBatter(batter);
    setEditOrder(String(batter.order));
    setEditName(batter.name);
    setEditNumber(batter.number || '');
    setEditPosition(batter.position || '');
  };

  const handleSaveEdit = async () => {
    const updated = opponentLineup.map((b) =>
      b.id === editBatter.id
        ? { ...b, order: Number(editOrder) || b.order, name: editName.trim(), number: editNumber.trim(), position: editPosition }
        : b
    ).sort((a, b) => a.order - b.order);
    await saveLineup(updated);
    setEditBatter(null);
  };

  const handleBatterTap = (batter) => {
    setSelectedBatter(batter);
    setPickerOpen(true);
  };

  const handlePickerConfirm = async ({ result, inning, rbi, run, note, pitcherId }) => {
    const nextOrder = (opponentAtBats.filter((ab) => ab.inning === inning).length) + 1;
    const newAtBat = {
      inning,
      batterId: selectedBatter.id,
      batterName: selectedBatter.name,
      result,
      order: nextOrder,
      rbi: rbi || 0,
      run: run || 0,
      note: note || '',
      pitcherId: pitcherId || '',
    };
    try {
      const res = await addOpponentAtBat(gameId, newAtBat);
      onOpponentAtBatAdded(res.atBat || { ...newAtBat, id: Date.now().toString() });
    } catch (e) {
      console.error(e);
    }
    setPickerOpen(false);
  };

  const handleDeleteAtBat = async (atBatId) => {
    try {
      await deleteOpponentAtBat(gameId, atBatId);
      onOpponentAtBatDeleted(atBatId);
    } catch (e) {
      console.error(e);
    }
  };

  // Effective opponent lineup for the selected inning (applies substitutions)
  const effectiveSortedLineup = getEffectiveOpponentLineup(
    [...opponentLineup].sort((a, b) => a.order - b.order),
    substitutions || [],
    selectedInning
  );

  const sortedLineup = [...opponentLineup].sort((a, b) => a.order - b.order);
  const inningAtBats = opponentAtBats.filter((ab) => ab.inning === selectedInning);

  // Players who entered via substitution this inning (opponent)
  const opponentSubsThisInning = new Set(
    (substitutions || [])
      .filter((s) => s.isOpponent && s.inning === selectedInning)
      .map((s) => s.battingOrder)
  );

  // Batter inning results map
  const batterInningResults = {};
  inningAtBats.forEach((ab) => {
    if (!batterInningResults[ab.batterId]) batterInningResults[ab.batterId] = [];
    batterInningResults[ab.batterId].push(ab);
  });

  return (
    <Box>
      {/* 상대팀 라인업 섹션 */}
      <Accordion defaultExpanded sx={{ boxShadow: 'none', '&:before': { display: 'none' }, borderBottom: 1, borderColor: 'divider' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            상대팀 라인업 ({sortedLineup.length}명)
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 2, pt: 0 }}>
          {/* Add batter form */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>타자 추가</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                label="타순"
                type="number"
                value={batterOrder}
                onChange={(e) => setBatterOrder(e.target.value)}
                size="small"
                sx={{ width: 72 }}
                inputProps={{ min: 1, max: 20 }}
              />
              <TextField
                label="이름"
                value={batterName}
                onChange={(e) => setBatterName(e.target.value)}
                size="small"
                sx={{ flex: 1 }}
              />
              <TextField
                label="등번호"
                value={batterNumber}
                onChange={(e) => setBatterNumber(e.target.value)}
                size="small"
                sx={{ width: 72 }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>포지션</InputLabel>
                <Select value={batterPosition} label="포지션" onChange={(e) => setBatterPosition(e.target.value)}>
                  <MenuItem value=""><em>없음</em></MenuItem>
                  {POSITIONS.map((pos) => (
                    <MenuItem key={pos.code} value={pos.code}>{pos.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                onClick={handleAddBatter}
                disabled={!batterName.trim() || addingBatter}
                startIcon={<AddIcon />}
                sx={{ height: 40, flexShrink: 0 }}
              >
                추가
              </Button>
            </Box>
          </Box>

          {/* Lineup list */}
          {lineupLoading ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>불러오는 중...</Typography>
          ) : sortedLineup.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>등록된 타자가 없습니다</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {sortedLineup.map((batter) => (
                <Box
                  key={batter.id}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1,
                    px: 1.5, py: 1, borderRadius: 1.5,
                    border: '1px solid', borderColor: 'divider',
                    bgcolor: 'background.paper',
                  }}
                >
                  <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 800, fontSize: '1rem', minWidth: 20, color: 'primary.main' }}>
                    {batter.order}
                  </Typography>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{batter.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {batter.number ? `#${batter.number}` : ''}{batter.position ? ` · ${POSITION_MAP[batter.position] || batter.position}` : ''}
                    </Typography>
                  </Box>
                  <IconButton size="small" onClick={() => openEditBatter(batter)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDeleteBatter(batter.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* 상대팀 타석 기록 섹션 */}
      <Accordion defaultExpanded sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            상대팀 타석 기록 ({opponentAtBats.length}타석)
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 2, pt: 0, pb: 2 }}>
          {/* Inning selector */}
          <Box sx={{ display: 'flex', gap: 0.75, pb: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
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

          <Divider sx={{ mb: 1.5 }} />

          {/* Opponent batter cards — uses effective lineup for the selected inning */}
          {effectiveSortedLineup.length > 0 ? (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1, display: 'block' }}>
                타자 선택 후 결과 입력
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {effectiveSortedLineup.map((batter) => {
                  const results = batterInningResults[batter.id] || [];
                  const isSubIn = opponentSubsThisInning.has(batter.order);
                  return (
                    <Box
                      key={batter.id}
                      onClick={() => handleBatterTap(batter)}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 1.5,
                        px: 1.5, py: 1.25, borderRadius: 2, cursor: 'pointer',
                        border: '1.5px solid', borderColor: 'divider',
                        bgcolor: 'background.paper',
                        transition: 'all 0.15s',
                        '&:active': { opacity: 0.75, bgcolor: 'action.hover' },
                      }}
                    >
                      <Typography
                        sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 800, fontSize: '1.1rem', minWidth: 24, textAlign: 'center', color: 'error.main' }}
                      >
                        {batter.order}
                      </Typography>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{batter.name}</Typography>
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
                          {batter.number ? `#${batter.number}` : ''}{batter.position ? ` · ${POSITION_MAP[batter.position] || batter.position}` : ''}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 120 }}>
                        {results.map((ab, i) => <ResultBadge key={i} result={ab.result} />)}
                        {results.length === 0 && <Typography variant="caption" sx={{ opacity: 0.45 }}>-</Typography>}
                      </Box>
                      <AddIcon sx={{ fontSize: 18, opacity: 0.6, flexShrink: 0 }} />
                    </Box>
                  );
                })}
              </Box>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body2" color="text.secondary">상대팀 라인업을 먼저 등록하세요</Typography>
            </Box>
          )}

          {/* This inning's at-bats list */}
          <Divider sx={{ mb: 1 }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
            {selectedInning}회 상대팀 기록 ({inningAtBats.length}타석)
          </Typography>
          {inningAtBats.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body2" color="text.secondary">아직 기록이 없어요</Typography>
            </Box>
          ) : (
            <List dense disablePadding sx={{ mt: 0.5 }}>
              {inningAtBats.map((ab, idx) => {
                const info = RESULT_CODES[ab.result];
                const colors = RESULT_TYPE_COLORS[info?.type] || RESULT_TYPE_COLORS.sacrifice;
                const pitcherPlayer = players.find((p) => p.id === ab.pitcherId);
                return (
                  <React.Fragment key={ab.id || idx}>
                    <ListItem
                      sx={{ py: 1, px: 0 }}
                      secondaryAction={
                        <IconButton size="small" onClick={() => handleDeleteAtBat(ab.id)} color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
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
                          {ab.result}
                        </Typography>
                      </Box>
                      <ListItemText
                        primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>{ab.batterName}</Typography>}
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {info?.label ?? ab.result}
                            {pitcherPlayer ? ` · 투수: ${pitcherPlayer.name}` : ''}
                            {ab.note ? ` · ${ab.note}` : ''}
                            {ab.rbi > 0 ? ` · 타점 ${ab.rbi}` : ''}
                            {ab.run > 0 ? ` · 득점 ${ab.run}` : ''}
                          </Typography>
                        }
                      />
                    </ListItem>
                    {idx < inningAtBats.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Edit batter dialog */}
      <Dialog open={!!editBatter} onClose={() => setEditBatter(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { mx: 2, borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>타자 수정</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 0.5 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField label="타순" type="number" value={editOrder} onChange={(e) => setEditOrder(e.target.value)} size="small" sx={{ width: 72 }} />
              <TextField label="이름" value={editName} onChange={(e) => setEditName(e.target.value)} size="small" sx={{ flex: 1 }} />
              <TextField label="등번호" value={editNumber} onChange={(e) => setEditNumber(e.target.value)} size="small" sx={{ width: 72 }} />
            </Box>
            <FormControl size="small" fullWidth>
              <InputLabel>포지션</InputLabel>
              <Select value={editPosition} label="포지션" onChange={(e) => setEditPosition(e.target.value)}>
                <MenuItem value=""><em>없음</em></MenuItem>
                {POSITIONS.map((pos) => <MenuItem key={pos.code} value={pos.code}>{pos.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
          <Button onClick={() => setEditBatter(null)} variant="outlined" sx={{ flex: 1 }}>취소</Button>
          <Button onClick={handleSaveEdit} variant="contained" disabled={!editName.trim()} sx={{ flex: 2 }}>저장</Button>
        </DialogActions>
      </Dialog>

      {/* OpponentAtBatPicker */}
      <OpponentAtBatPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onConfirm={handlePickerConfirm}
        batterName={selectedBatter?.name}
        inning={selectedInning}
        maxInning={maxInning}
        pitcherOptions={pitcherOptions}
      />
    </Box>
  );
}

// ─── PitchingTab ──────────────────────────────────────────────────────────────

function PitchingTab({ gameId, players, pitchingRecords, opponentAtBats, onPitchingAdded, onPitchingDeleted }) {
  const [pitcherId, setPitcherId] = useState('');
  const [startInning, setStartInning] = useState(1);
  const [endInning, setEndInning] = useState(1);
  const [pitchCount, setPitchCount] = useState('');
  const [adding, setAdding] = useState(false);

  const playerMap = Object.fromEntries((players || []).map((p) => [p.id, p]));

  const handleAdd = async () => {
    if (!pitcherId) return;
    setAdding(true);
    const newRecord = {
      pitcherId,
      startInning: Number(startInning),
      endInning: Number(endInning),
      pitchCount: pitchCount !== '' ? Number(pitchCount) : null,
    };
    try {
      const res = await addPitching(gameId, newRecord);
      onPitchingAdded(res.record || { ...newRecord, id: Date.now().toString() });
      setPitcherId('');
      setStartInning(1);
      setEndInning(1);
      setPitchCount('');
    } catch (e) {
      console.error(e);
    }
    setAdding(false);
  };

  const handleDelete = async (recordId) => {
    try {
      await deletePitching(gameId, recordId);
      onPitchingDeleted(recordId);
    } catch (e) {
      console.error(e);
    }
  };

  // Calculate per-pitcher stats from opponentAtBats
  const pitcherStatsMap = {};
  opponentAtBats.forEach((ab) => {
    if (!ab.pitcherId) return;
    if (!pitcherStatsMap[ab.pitcherId]) {
      pitcherStatsMap[ab.pitcherId] = { H: 0, K: 0, BB: 0, R: 0 };
    }
    const s = pitcherStatsMap[ab.pitcherId];
    if (['1H', '2H', '3H', 'HR'].includes(ab.result)) s.H += 1;
    if (ab.result === 'SO') s.K += 1;
    if (ab.result === 'BB' || ab.result === 'HBP') s.BB += 1;
    s.R += ab.run || 0;
  });

  // IP calculation: innings pitched = endInning - startInning + 1 (whole innings)
  const calcIP = (rec) => {
    const full = rec.endInning - rec.startInning + 1;
    return full > 0 ? full : 0;
  };

  const inningRanges = Array.from({ length: 9 }, (_, i) => i + 1);

  return (
    <Box sx={{ pb: 2 }}>
      {/* Add pitching appearance form */}
      <Box sx={{ p: 2, bgcolor: 'grey.50', m: 2, borderRadius: 2 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1.5, display: 'block' }}>
          투수 등판 추가
        </Typography>
        <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
          <InputLabel>투수 선택</InputLabel>
          <Select value={pitcherId} label="투수 선택" onChange={(e) => setPitcherId(e.target.value)}>
            <MenuItem value=""><em>선택</em></MenuItem>
            {(players || []).map((p) => (
              <MenuItem key={p.id} value={p.id}>#{p.number} {p.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
          <FormControl size="small" sx={{ flex: 1 }}>
            <InputLabel>시작 이닝</InputLabel>
            <Select value={startInning} label="시작 이닝" onChange={(e) => setStartInning(e.target.value)}>
              {inningRanges.map((n) => <MenuItem key={n} value={n}>{n}회</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ flex: 1 }}>
            <InputLabel>종료 이닝</InputLabel>
            <Select value={endInning} label="종료 이닝" onChange={(e) => setEndInning(e.target.value)}>
              {inningRanges.map((n) => <MenuItem key={n} value={n}>{n}회</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            label="투구수"
            type="number"
            value={pitchCount}
            onChange={(e) => setPitchCount(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
            inputProps={{ min: 0 }}
          />
        </Box>
        <Button
          variant="contained"
          fullWidth
          onClick={handleAdd}
          disabled={!pitcherId || adding}
          startIcon={<AddIcon />}
        >
          {adding ? '추가 중...' : '등판 추가'}
        </Button>
      </Box>

      {/* Pitching appearances list */}
      <Box sx={{ px: 2, mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>등판 기록</Typography>
        {pitchingRecords.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>등판 기록이 없습니다</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {pitchingRecords.map((rec) => {
              const pitcher = playerMap[rec.pitcherId];
              return (
                <Box
                  key={rec.id}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    px: 1.5, py: 1.25, borderRadius: 2,
                    border: '1.5px solid', borderColor: 'divider',
                    bgcolor: 'background.paper',
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {pitcher ? `#${pitcher.number} ${pitcher.name}` : rec.pitcherId}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {rec.startInning}회 ~ {rec.endInning}회
                      {rec.pitchCount != null ? ` · ${rec.pitchCount}구` : ''}
                    </Typography>
                  </Box>
                  <IconButton size="small" color="error" onClick={() => handleDelete(rec.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Pitching stats table */}
      <Box sx={{ px: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>투수 성적</Typography>
        {pitchingRecords.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>등판 기록을 추가하면 성적이 표시됩니다</Typography>
        ) : (
          <TableContainer sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700 }}>투수</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">IP</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">투구수</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">피안타</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">탈삼진</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">볼넷</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">실점</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pitchingRecords.map((rec) => {
                  const pitcher = playerMap[rec.pitcherId];
                  const stats = pitcherStatsMap[rec.pitcherId] || { H: 0, K: 0, BB: 0, R: 0 };
                  const ip = calcIP(rec);
                  return (
                    <TableRow key={rec.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {pitcher ? pitcher.name : rec.pitcherId}
                        </Typography>
                        {pitcher && (
                          <Typography variant="caption" color="text.secondary">#{pitcher.number}</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 700 }}>{ip}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography sx={{ fontFamily: '"Roboto Mono", monospace' }}>
                          {rec.pitchCount != null ? rec.pitchCount : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography sx={{ fontFamily: '"Roboto Mono", monospace', color: stats.H > 0 ? 'success.main' : 'text.primary' }}>
                          {stats.H}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography sx={{ fontFamily: '"Roboto Mono", monospace', color: stats.K > 0 ? 'primary.main' : 'text.primary' }}>
                          {stats.K}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography sx={{ fontFamily: '"Roboto Mono", monospace' }}>{stats.BB}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography sx={{ fontFamily: '"Roboto Mono", monospace', color: stats.R > 0 ? 'error.main' : 'text.primary' }}>
                          {stats.R}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
}

// ─── GameDetailPage ───────────────────────────────────────────────────────────

export default function GameDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [game, setGame] = useState(null);
  const [atBats, setAtBats] = useState([]);
  const [players, setPlayers] = useState([]);
  const [opponentAtBats, setOpponentAtBats] = useState([]);
  const [pitchingRecords, setPitchingRecords] = useState([]);
  const [substitutions, setSubstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [endGameOpen, setEndGameOpen] = useState(false);
  const [theirScore, setTheirScore] = useState('');
  const [endingSaving, setEndingSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      getGame(id),
      getPlayers(),
      getOpponentAtBats(id).catch(() => ({ atBats: [] })),
      getPitching(id).catch(() => ({ records: [] })),
      getSubstitutions(id).catch(() => ({ data: [] })),
    ])
      .then(([gameRes, playersRes, oppAtBatsRes, pitchingRes, subsRes]) => {
        const g = gameRes.data || gameRes;
        setGame(g);
        setAtBats(g.atBats || []);
        setPlayers(playersRes.data || []);
        setOpponentAtBats(
          oppAtBatsRes.atBats || oppAtBatsRes.data || (Array.isArray(oppAtBatsRes) ? oppAtBatsRes : [])
        );
        setPitchingRecords(
          pitchingRes.records || pitchingRes.data || (Array.isArray(pitchingRes) ? pitchingRes : [])
        );
        setSubstitutions(
          subsRes.data || subsRes.substitutions || (Array.isArray(subsRes) ? subsRes : [])
        );
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const ourScore = atBats.reduce((sum, ab) => sum + (ab.run || 0), 0);

  const handleEndGame = async () => {
    const scoreTheirs = Number(theirScore) || 0;
    const result = ourScore > scoreTheirs ? 'W' : ourScore < scoreTheirs ? 'L' : 'D';
    setEndingSaving(true);
    try {
      const res = await updateGame(id, { status: 'final', scoreOurs: ourScore, scoreTheirs, result });
      setGame(res.data || res);
      setEndGameOpen(false);
      setTheirScore('');
    } catch (e) {
      console.error(e);
    }
    setEndingSaving(false);
  };

  const handleSubstitutionAdded = async (data) => {
    try {
      const res = await addSubstitution(id, data);
      const newSub = res.substitution || res.data || { ...data, id: Date.now().toString() };
      setSubstitutions((prev) => [...prev, newSub]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubstitutionDeleted = async (subId) => {
    try {
      await deleteSubstitution(id, subId);
      setSubstitutions((prev) => prev.filter((s) => s.id !== subId));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  if (!game) return null;

  return (
    <Box sx={{ pb: 10 }}>
      <Box sx={{ p: 2, pb: 0 }}>
        <GameInfoCard game={game} ourScore={ourScore} />
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <Button size="small" startIcon={<EditIcon />} onClick={() => navigate(`/games/${id}/edit`)}>
            경기 정보 수정
          </Button>
          {game.status !== 'final' && (
            <Button size="small" variant="contained" color="secondary" onClick={() => setEndGameOpen(true)}>
              경기 종료
            </Button>
          )}
        </Box>
      </Box>

      {/* 경기 종료 Dialog */}
      <Dialog open={endGameOpen} onClose={() => setEndGameOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { mx: 2, borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>경기 종료</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="caption" color="text.secondary">우리팀 (자동 계산)</Typography>
              <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 800, fontSize: '2rem', color: 'primary.main' }}>
                {ourScore}
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.secondary' }}>:</Typography>
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="caption" color="text.secondary">{game.opponent}</Typography>
              <TextField
                type="number"
                value={theirScore}
                onChange={(e) => setTheirScore(e.target.value)}
                inputProps={{ min: 0, style: { textAlign: 'center', fontSize: '2rem', fontWeight: 800, fontFamily: 'Roboto Mono, monospace', padding: '4px 8px' } }}
                sx={{ mt: 0.5 }}
                placeholder="0"
                autoFocus
              />
            </Box>
          </Box>
          {theirScore !== '' && (
            <Chip
              label={ourScore > Number(theirScore) ? '승리 🎉' : ourScore < Number(theirScore) ? '패배' : '무승부'}
              color={ourScore > Number(theirScore) ? 'success' : ourScore < Number(theirScore) ? 'error' : 'default'}
              sx={{ width: '100%', fontWeight: 700, fontSize: '1rem', height: 40 }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
          <Button onClick={() => setEndGameOpen(false)} variant="outlined" sx={{ flex: 1 }}>취소</Button>
          <Button onClick={handleEndGame} variant="contained" disabled={theirScore === '' || endingSaving} sx={{ flex: 2 }}>
            {endingSaving ? '저장 중...' : '경기 종료 확정'}
          </Button>
        </DialogActions>
      </Dialog>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="라인업" />
        <Tab label="타석 기록" />
        <Tab label="상대팀 기록" />
        <Tab label="투수 기록" />
      </Tabs>

      {tab === 0 && (
        <Box sx={{ pt: 2 }}>
          <LineupTab
            lineup={game.lineup}
            players={players}
            game={game}
            substitutions={substitutions}
            onSubstitutionAdded={handleSubstitutionAdded}
            onSubstitutionDeleted={handleSubstitutionDeleted}
          />
          <Box sx={{ px: 2, mt: 2 }}>
            <Button variant="outlined" fullWidth onClick={() => navigate(`/games/${id}/edit`)}>
              라인업 수정
            </Button>
          </Box>
        </Box>
      )}

      {tab === 1 && (
        <AtBatsTab
          gameId={id}
          game={game}
          players={players}
          atBats={atBats}
          substitutions={substitutions}
          onAtBatAdded={(ab) => setAtBats((prev) => [...prev, ab])}
          onAtBatDeleted={(abId) => setAtBats((prev) => prev.filter((ab) => ab.id !== abId))}
        />
      )}

      {tab === 2 && (
        <OpponentTab
          gameId={id}
          game={game}
          players={players}
          opponentAtBats={opponentAtBats}
          substitutions={substitutions}
          onOpponentAtBatAdded={(ab) => setOpponentAtBats((prev) => [...prev, ab])}
          onOpponentAtBatDeleted={(abId) => setOpponentAtBats((prev) => prev.filter((ab) => ab.id !== abId))}
        />
      )}

      {tab === 3 && (
        <PitchingTab
          gameId={id}
          players={players}
          pitchingRecords={pitchingRecords}
          opponentAtBats={opponentAtBats}
          onPitchingAdded={(rec) => setPitchingRecords((prev) => [...prev, rec])}
          onPitchingDeleted={(recId) => setPitchingRecords((prev) => prev.filter((r) => r.id !== recId))}
        />
      )}
    </Box>
  );
}
