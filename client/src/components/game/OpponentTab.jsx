import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  getOpponentLineup,
  updateOpponentLineup,
  addOpponentAtBat,
  deleteOpponentAtBat,
} from '../../api.js';
import OpponentAtBatPicker from '../OpponentAtBatPicker.jsx';
import { RESULT_CODES, RESULT_TYPE_COLORS, POSITIONS, POSITION_MAP } from '../../utils/constants.js';
import { getEffectiveOpponentLineup } from '../../utils/lineup.js';

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

export default function OpponentTab({ gameId, game, players, opponentAtBats, substitutions, onOpponentAtBatAdded, onOpponentAtBatDeleted }) {
  const maxInning = game?.innings || 9;

  const [opponentLineup, setOpponentLineup] = useState([]);
  const [lineupLoading, setLineupLoading] = useState(true);

  const [batterOrder, setBatterOrder] = useState('');
  const [batterName, setBatterName] = useState('');
  const [batterNumber, setBatterNumber] = useState('');
  const [batterPosition, setBatterPosition] = useState('');
  const [addingBatter, setAddingBatter] = useState(false);

  const [editBatter, setEditBatter] = useState(null);
  const [editOrder, setEditOrder] = useState('');
  const [editName, setEditName] = useState('');
  const [editNumber, setEditNumber] = useState('');
  const [editPosition, setEditPosition] = useState('');

  const [selectedInning, setSelectedInning] = useState(1);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedBatter, setSelectedBatter] = useState(null);

  const pitcherOptions = useMemo(() => {
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
    const targetOrder = editBatter.order;
    const updated = opponentLineup.map((b) =>
      b.order === targetOrder
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
      batterName: selectedBatter.name,
      result,
      batterOrder: selectedBatter.order,
      rbi: rbi || 0,
      run: run || 0,
      note: note || '',
      pitcherId: pitcherId || '',
    };
    try {
      const res = await addOpponentAtBat(gameId, newAtBat);
      onOpponentAtBatAdded(res.data || { ...newAtBat, id: Date.now().toString() });
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

  const effectiveSortedLineup = getEffectiveOpponentLineup(
    [...opponentLineup].sort((a, b) => a.order - b.order),
    substitutions || [],
    selectedInning
  );

  const sortedLineup = [...opponentLineup].sort((a, b) => a.order - b.order);
  const inningAtBats = opponentAtBats.filter((ab) => ab.inning === selectedInning);

  const opponentSubsThisInning = new Set(
    (substitutions || [])
      .filter((s) => s.isOpponent && s.inning === selectedInning)
      .map((s) => s.battingOrder)
  );

  const batterInningResults = {};
  inningAtBats.forEach((ab) => {
    if (!batterInningResults[ab.batterOrder]) batterInningResults[ab.batterOrder] = [];
    batterInningResults[ab.batterOrder].push(ab);
  });

  return (
    <Box>
      <Accordion defaultExpanded sx={{ boxShadow: 'none', '&:before': { display: 'none' }, borderBottom: 1, borderColor: 'divider' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            상대팀 라인업 ({sortedLineup.length}명)
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 2, pt: 0 }}>
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

      <Accordion defaultExpanded sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            상대팀 타석 기록 ({opponentAtBats.length}타석)
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 2, pt: 0, pb: 2 }}>
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

          {effectiveSortedLineup.length > 0 ? (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1, display: 'block' }}>
                타자 선택 후 결과 입력
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {effectiveSortedLineup.map((batter) => {
                  const results = batterInningResults[batter.order] || [];
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
