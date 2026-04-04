import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Divider from '@mui/material/Divider';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import { INNING_EVENT_TYPES, FIELDER_POSITIONS } from '../../utils/constants.js';

const BASE_OPTIONS = [
  { value: null, label: '—' },
  { value: 1, label: '1루' },
  { value: 2, label: '2루' },
  { value: 3, label: '3루' },
];

const TO_BASE_OPTIONS = [
  { value: null, label: '—' },
  { value: 0, label: '아웃' },
  { value: 1, label: '1루' },
  { value: 2, label: '2루' },
  { value: 3, label: '3루' },
  { value: 4, label: '홈인 (득점)' },
];

// 이벤트 타입별로 표시할 필드 결정
const TYPE_FIELDS = {
  SB:  { runner: true,  pitcher: true,  fielder: false, from: true,  to: true  },
  CS:  { runner: true,  pitcher: true,  fielder: true,  from: true,  to: false },
  WP:  { runner: true,  pitcher: true,  fielder: false, from: true,  to: true  },
  PB:  { runner: true,  pitcher: false, fielder: false, from: true,  to: true  },
  BK:  { runner: true,  pitcher: true,  fielder: false, from: true,  to: true  },
  E:   { runner: true,  pitcher: false, fielder: true,  from: true,  to: true  },
  OB:  { runner: true,  pitcher: false, fielder: false, from: true,  to: false },
  DI:  { runner: true,  pitcher: false, fielder: false, from: true,  to: true  },
  PK:  { runner: true,  pitcher: true,  fielder: false, from: true,  to: false },
};

export default function InningEventModal({
  open, onClose, onConfirm,
  maxInning = 9,
  players = [],
  initialData = null,
  defaultInning = 1,
}) {
  const [type, setType] = useState('SB');
  const [inning, setInning] = useState(defaultInning);
  const [runnerId, setRunnerId] = useState('');
  const [runnerName, setRunnerName] = useState('');
  const [pitcherId, setPitcherId] = useState('');
  const [fielderPos, setFielderPos] = useState('');
  const [fromBase, setFromBase] = useState(null);
  const [toBase, setToBase] = useState(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      if (initialData) {
        setType(initialData.type || 'SB');
        setInning(initialData.inning || 1);
        setRunnerId(initialData.runnerId || '');
        setRunnerName(initialData.runnerName || '');
        setPitcherId(initialData.pitcherId || '');
        setFielderPos(initialData.fielderPos != null ? String(initialData.fielderPos) : '');
        setFromBase(initialData.fromBase ?? null);
        setToBase(initialData.toBase ?? null);
        setNote(initialData.note || '');
      } else {
        setType('SB');
        setInning(defaultInning);
        setRunnerId('');
        setRunnerName('');
        setPitcherId('');
        setFielderPos('');
        setFromBase(null);
        setToBase(null);
        setNote('');
      }
    }
  }, [open, defaultInning]);

  const handleTypeChange = (newType) => {
    setType(newType);
    // 타입 변경 시 필드 초기화
    setFromBase(null);
    setToBase(null);
    setFielderPos('');
  };

  const handleConfirm = () => {
    if (!type || !inning) return;
    onConfirm({
      type,
      inning: Number(inning),
      runnerId: runnerId || null,
      runnerName: runnerName.trim(),
      pitcherId: pitcherId || null,
      fielderPos: fielderPos !== '' ? Number(fielderPos) : null,
      fromBase: fromBase != null ? Number(fromBase) : null,
      toBase: toBase != null ? Number(toBase) : null,
      note: note.trim(),
    });
  };

  const fields = TYPE_FIELDS[type] || {};
  const typeInfo = INNING_EVENT_TYPES[type];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{ sx: { borderRadius: 3, mx: 1 } }}
    >
      <DialogTitle sx={{ pb: 1, pt: 2, px: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, fontSize: '1rem' }}>
            이닝 이벤트 기록
          </Typography>
          <Typography variant="caption" color="text.secondary">
            도루·폭투·포일·보크·실책 등
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 2, pt: 0.5, pb: 1 }}>
        {/* 이벤트 타입 선택 */}
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.75, display: 'block' }}>
            이벤트 종류
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {Object.values(INNING_EVENT_TYPES).map(ev => (
              <Chip
                key={ev.code}
                label={`${ev.code} ${ev.label}`}
                size="small"
                onClick={() => handleTypeChange(ev.code)}
                sx={{
                  fontWeight: 700,
                  cursor: 'pointer',
                  bgcolor: type === ev.code ? ev.color : ev.bg,
                  color: type === ev.code ? '#fff' : ev.color,
                  border: `1px solid ${ev.color}`,
                  '&:hover': { bgcolor: ev.color, color: '#fff' },
                  fontFamily: '"Roboto Mono", monospace',
                }}
              />
            ))}
          </Box>
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        {/* 이닝 선택 */}
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.75, display: 'block' }}>이닝</Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {Array.from({ length: maxInning }, (_, i) => i + 1).map(n => (
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

        <Divider sx={{ mb: 1.5 }} />

        {/* 주자 선택 (선수 목록 있을 때는 드롭다운, 없으면 텍스트) */}
        {fields.runner && (
          <Box sx={{ mb: 1.25 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block' }}>
              {type === 'WP' || type === 'PB' || type === 'BK' ? '진루 주자' : '주자'}
            </Typography>
            {players.length > 0 ? (
              <FormControl fullWidth size="small">
                <Select
                  value={runnerId}
                  onChange={e => {
                    setRunnerId(e.target.value);
                    const p = players.find(pl => (pl.id || pl._id) === e.target.value);
                    if (p) setRunnerName(p.name);
                  }}
                  displayEmpty
                >
                  <MenuItem value=""><em>선수 선택</em></MenuItem>
                  {players.map(p => (
                    <MenuItem key={p.id || p._id} value={p.id || p._id}>
                      {p.number ? `#${p.number} ` : ''}{p.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <TextField
                fullWidth size="small"
                placeholder="주자 이름"
                value={runnerName}
                onChange={e => setRunnerName(e.target.value)}
                inputProps={{ maxLength: 20 }}
              />
            )}
          </Box>
        )}

        {/* 투수 선택 */}
        {fields.pitcher && players.length > 0 && (
          <Box sx={{ mb: 1.25 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block' }}>
              {type === 'WP' || type === 'BK' ? '폭투/보크 투수' : '당시 투수'}
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={pitcherId}
                onChange={e => setPitcherId(e.target.value)}
                displayEmpty
              >
                <MenuItem value=""><em>선택 안 함</em></MenuItem>
                {players.filter(p => p.position === 'P' || true).map(p => (
                  <MenuItem key={p.id || p._id} value={p.id || p._id}>
                    {p.number ? `#${p.number} ` : ''}{p.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {/* 수비수 포지션 (실책·도루자) */}
        {fields.fielder && (
          <Box sx={{ mb: 1.25 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block' }}>
              {type === 'E' ? '실책 수비수' : type === 'CS' ? '포수(2번)' : '수비 포지션'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {FIELDER_POSITIONS.map(fp => (
                <Button
                  key={fp.num}
                  size="small"
                  variant={fielderPos === String(fp.num) ? 'contained' : 'outlined'}
                  onClick={() => setFielderPos(fielderPos === String(fp.num) ? '' : String(fp.num))}
                  sx={{
                    minWidth: 0, px: 1, py: 0.25, minHeight: 32,
                    bgcolor: fielderPos === String(fp.num) ? '#0d1b3e' : 'white',
                    color: fielderPos === String(fp.num) ? '#fff' : 'text.primary',
                    borderColor: fielderPos === String(fp.num) ? '#0d1b3e' : 'divider',
                    fontFamily: '"Roboto Mono", monospace',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                  }}
                >
                  {fp.num}({fp.code})
                </Button>
              ))}
            </Box>
          </Box>
        )}

        {/* 이전 루 / 이후 루 */}
        {(fields.from || fields.to) && (
          <Box sx={{ display: 'flex', gap: 1, mb: 1.25 }}>
            {fields.from && (
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>이전 루</InputLabel>
                <Select value={fromBase ?? ''} label="이전 루" onChange={e => setFromBase(e.target.value === '' ? null : Number(e.target.value))}>
                  {BASE_OPTIONS.map(opt => (
                    <MenuItem key={String(opt.value)} value={opt.value ?? ''}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            {fields.to && (
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>이후 루</InputLabel>
                <Select value={toBase ?? ''} label="이후 루" onChange={e => setToBase(e.target.value === '' ? null : Number(e.target.value))}>
                  {TO_BASE_OPTIONS.map(opt => (
                    <MenuItem key={String(opt.value)} value={opt.value ?? ''}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        )}

        {/* 메모 */}
        <TextField
          fullWidth size="small"
          placeholder="메모 (선택사항)"
          value={note}
          onChange={e => setNote(e.target.value)}
          inputProps={{ maxLength: 80 }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 2, pb: 2, pt: 1, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" sx={{ flex: 1 }}>취소</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!type}
          startIcon={<CheckIcon />}
          sx={{ flex: 2, bgcolor: typeInfo?.color, '&:hover': { bgcolor: typeInfo?.color, filter: 'brightness(0.9)' } }}
        >
          {typeInfo?.label} 기록
        </Button>
      </DialogActions>
    </Dialog>
  );
}
