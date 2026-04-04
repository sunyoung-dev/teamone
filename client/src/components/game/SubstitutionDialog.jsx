import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { POSITIONS } from '../../utils/constants.js';
import { getEffectiveLineup } from '../../utils/lineup.js';

export default function SubstitutionDialog({ open, onClose, onConfirm, game, players, substitutions }) {
  const maxInning = game?.innings || 9;
  const [inning, setInning] = useState(1);
  const [isOpponent, setIsOpponent] = useState(false);

  const [outPlayerId, setOutPlayerId] = useState('');
  const [inPlayerId, setInPlayerId] = useState('');

  const [outPlayerName, setOutPlayerName] = useState('');
  const [inPlayerName, setInPlayerName] = useState('');
  const [inPlayerNumber, setInPlayerNumber] = useState('');
  const [battingOrder, setBattingOrder] = useState('');

  const [position, setPosition] = useState('');
  const [saving, setSaving] = useState(false);

  const playerMap = Object.fromEntries((players || []).map((p) => [p.id, p]));

  const originalLineup = game?.lineup || [];
  const effectiveLineup = getEffectiveLineup(originalLineup, substitutions, inning)
    .sort((a, b) => a.battingOrder - b.battingOrder)
    .map((e) => ({ ...e, player: playerMap[e.playerId] }))
    .filter((e) => e.player);

  const effectivePlayerIds = new Set(effectiveLineup.map((e) => e.playerId));
  const availableInPlayers = [...(players || [])].sort((a, b) => (a.number || 0) - (b.number || 0));

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
                    <MenuItem key={p.id} value={p.id}>
                      #{p.number} {p.name}
                      {effectivePlayerIds.has(p.id) && (
                        <Typography component="span" variant="caption" sx={{ ml: 0.75, color: 'text.disabled' }}>
                          (출전중)
                        </Typography>
                      )}
                    </MenuItem>
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
