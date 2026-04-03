import { useState, useEffect } from 'react';
import Alert from '@mui/material/Alert';
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
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import { updateAtBat } from '../../api.js';
import { RESULT_CODES } from '../../utils/constants.js';
import { calcRunRbi } from '../../utils/pitchCount.js';

export const BASE_LABELS = { 1: '1루', 2: '2루', 3: '3루', 4: '홈인', 0: '아웃' };
const FROM_OPTIONS = [1, 2, 3];
const TO_OPTIONS = { 1: [2, 3, 4, 0], 2: [3, 4, 0], 3: [4, 0] };

export default function RunnerEventDialog({ open, onClose, atBat, gameId, players, lineup, onSaved }) {
  const [events, setEvents] = useState([]);
  const [newName, setNewName] = useState('');
  const [newFrom, setNewFrom] = useState(null);
  const [newTo, setNewTo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // 라인업에 있는 선수만 주자 목록에 표시
  const lineupPlayerIds = new Set((lineup || []).map((e) => e.playerId));
  const lineupPlayers = (players || []).filter((p) => lineupPlayerIds.has(p.id));

  useEffect(() => {
    if (open) {
      setEvents(atBat?.runnerEvents ? [...atBat.runnerEvents] : []);
      setNewName('');
      setNewFrom(null);
      setNewTo(null);
      setSaveError(null);
    }
  }, [open, atBat]);

  const canAdd = newName.trim() && newFrom != null && newTo != null;

  const handleAdd = () => {
    if (!canAdd) return;
    setEvents((prev) => [...prev, { runnerName: newName.trim(), fromBase: newFrom, toBase: newTo }]);
    setNewName('');
    setNewFrom(null);
    setNewTo(null);
  };

  const handleDelete = (idx) => setEvents((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const { run, rbi } = calcRunRbi(events, atBat.result);
      const res = await updateAtBat(gameId, atBat.id, { runnerEvents: events, run, rbi });
      onSaved(res.data || { ...atBat, runnerEvents: events, run, rbi });
      onClose();
    } catch (e) {
      console.error(e);
      setSaveError(e.message || '저장에 실패했습니다');
    }
    setSaving(false);
  };

  if (!atBat) return null;
  const info = RESULT_CODES[atBat.result];
  const playerMap = Object.fromEntries((players || []).map((p) => [p.id, p]));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs"
      PaperProps={{ sx: { borderRadius: 3, mx: 1, maxHeight: '88vh' } }}>
      <DialogTitle sx={{ pb: 1, pt: 2, px: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>주루 기록</Typography>
          <Typography variant="body2" color="text.secondary">
            {atBat.inning}회 · {playerMap[atBat.playerId]?.name ?? atBat.playerId} · {info?.label ?? atBat.result}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 2, pt: 0, pb: 1 }}>
        {saveError && (
          <Alert severity="error" sx={{ mb: 1.5, mt: 1 }}>{saveError}</Alert>
        )}
        {/* 기록된 주루 이벤트 목록 */}
        {events.length > 0 ? (
          <Box sx={{ mb: 1.5 }}>
            {events.map((ev, idx) => (
              <Box key={idx} sx={{
                display: 'flex', alignItems: 'center', gap: 1,
                py: 0.75, borderBottom: '1px solid', borderColor: 'divider',
              }}>
                <DirectionsRunIcon sx={{ fontSize: 15, color: 'text.disabled', flexShrink: 0 }} />
                <Typography variant="body2" sx={{ flex: 1, fontWeight: 600 }}>{ev.runnerName}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                  {BASE_LABELS[ev.fromBase]} →
                </Typography>
                <Chip
                  label={BASE_LABELS[ev.toBase]}
                  size="small"
                  color={ev.toBase === 4 ? 'success' : ev.toBase === 0 ? 'error' : 'default'}
                  sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem', flexShrink: 0 }}
                />
                <IconButton size="small" color="error" onClick={() => handleDelete(idx)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            아직 주루 기록이 없습니다
          </Typography>
        )}

        <Divider sx={{ my: 1.5 }} />
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1, display: 'block' }}>
          주루 이벤트 추가
        </Typography>

        {/* 주자 선택 (라인업 선수만) */}
        <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
          <InputLabel>주자</InputLabel>
          <Select value={newName} label="주자" onChange={(e) => setNewName(e.target.value)}>
            <MenuItem value=""><em>선택</em></MenuItem>
            {lineupPlayers.map((p) => (
              <MenuItem key={p.id} value={p.name}>#{p.number} {p.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* 출발 베이스 */}
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>출발 베이스</Typography>
        <Box sx={{ display: 'flex', gap: 0.75, mt: 0.5, mb: 1.5 }}>
          {FROM_OPTIONS.map((b) => (
            <Chip
              key={b}
              label={BASE_LABELS[b]}
              onClick={() => { setNewFrom(b); setNewTo(null); }}
              color={newFrom === b ? 'primary' : 'default'}
              sx={{ fontWeight: 700, flex: 1, cursor: 'pointer' }}
            />
          ))}
        </Box>

        {/* 결과 */}
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>결과</Typography>
        <Box sx={{ display: 'flex', gap: 0.75, mt: 0.5, mb: 1.5, flexWrap: 'wrap' }}>
          {(newFrom ? TO_OPTIONS[newFrom] : [2, 3, 4, 0]).map((b) => (
            <Chip
              key={b}
              label={BASE_LABELS[b]}
              onClick={() => newFrom && setNewTo(b)}
              color={newTo === b ? (b === 4 ? 'success' : b === 0 ? 'error' : 'primary') : 'default'}
              disabled={!newFrom}
              sx={{ fontWeight: 700, cursor: newFrom ? 'pointer' : 'default' }}
            />
          ))}
        </Box>

        <Button variant="outlined" fullWidth startIcon={<AddIcon />} onClick={handleAdd} disabled={!canAdd}>
          추가
        </Button>
      </DialogContent>

      <DialogActions sx={{ px: 2, pb: 2, pt: 1, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" sx={{ flex: 1 }}>취소</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving} sx={{ flex: 2 }}>
          {saving ? '저장 중...' : '저장'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
