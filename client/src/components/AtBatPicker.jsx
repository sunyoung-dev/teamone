import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import { RESULT_GROUPS, RESULT_CODES, RESULT_TYPE_COLORS } from '../utils/constants.js';

const GROUP_COLORS = {
  hit: {
    bg: '#e8f5e9',
    selectedBg: '#2e7d32',
    border: '#4caf50',
    text: '#1b5e20',
    selectedText: '#ffffff',
    headerBg: '#c8e6c9',
    headerText: '#1b5e20',
  },
  out: {
    bg: '#ffebee',
    selectedBg: '#c62828',
    border: '#ef5350',
    text: '#b71c1c',
    selectedText: '#ffffff',
    headerBg: '#ffcdd2',
    headerText: '#b71c1c',
  },
  onBase: {
    bg: '#e3f2fd',
    selectedBg: '#1565c0',
    border: '#42a5f5',
    text: '#0d47a1',
    selectedText: '#ffffff',
    headerBg: '#bbdefb',
    headerText: '#0d47a1',
  },
  sacrifice: {
    bg: '#f5f5f5',
    selectedBg: '#616161',
    border: '#9e9e9e',
    text: '#424242',
    selectedText: '#ffffff',
    headerBg: '#e0e0e0',
    headerText: '#424242',
  },
};

function ResultButton({ code, selected, onSelect }) {
  const info = RESULT_CODES[code];
  const colors = GROUP_COLORS[info?.type] || GROUP_COLORS.sacrifice;

  return (
    <Button
      onClick={() => onSelect(code)}
      fullWidth
      variant={selected ? 'contained' : 'outlined'}
      sx={{
        minHeight: 64,
        flexDirection: 'column',
        gap: 0.25,
        p: 0.75,
        borderRadius: 2,
        border: `2px solid ${colors.border}`,
        bgcolor: selected ? colors.selectedBg : colors.bg,
        color: selected ? colors.selectedText : colors.text,
        '&:hover': {
          bgcolor: selected ? colors.selectedBg : colors.border,
          color: colors.selectedText,
          borderColor: colors.border,
        },
        transition: 'all 0.15s ease',
        boxShadow: selected ? '0 2px 8px rgba(0,0,0,0.25)' : 'none',
      }}
    >
      <Typography
        variant="body1"
        sx={{
          fontWeight: 800,
          fontSize: '1rem',
          fontFamily: '"Roboto Mono", monospace',
          lineHeight: 1,
        }}
      >
        {code}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          fontSize: '0.65rem',
          fontWeight: 600,
          lineHeight: 1,
          opacity: 0.9,
        }}
      >
        {info?.label}
      </Typography>
    </Button>
  );
}

function Counter({ label, value, onChange, min = 0, max = 9 }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 32 }}>
        {label}
      </Typography>
      <IconButton
        size="small"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        sx={{ bgcolor: 'grey.100', width: 36, height: 36 }}
      >
        <RemoveIcon fontSize="small" />
      </IconButton>
      <Typography
        sx={{
          fontFamily: '"Roboto Mono", monospace',
          fontWeight: 700,
          fontSize: '1.25rem',
          minWidth: 28,
          textAlign: 'center',
        }}
      >
        {value}
      </Typography>
      <IconButton
        size="small"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        sx={{ bgcolor: 'grey.100', width: 36, height: 36 }}
      >
        <AddIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

export default function AtBatPicker({
  open,
  onClose,
  onConfirm,
  playerName,
  inning,
  maxInning = 9,
  initialResult = null,
  initialInning = null,
  initialRbi = 0,
}) {
  const [selectedResult, setSelectedResult] = useState(initialResult);
  const [selectedInning, setSelectedInning] = useState(initialInning || inning || 1);
  const [rbi, setRbi] = useState(initialRbi);
  const [run, setRun] = useState(0);
  const [note, setNote] = useState('');

  const handleConfirm = () => {
    if (!selectedResult) return;
    onConfirm({ result: selectedResult, inning: selectedInning, rbi, run, note });
  };

  const handleClose = () => {
    setSelectedResult(initialResult);
    setSelectedInning(initialInning || inning || 1);
    setRbi(initialRbi);
    setRun(0);
    setNote('');
    onClose();
  };

  const selectedInfo = selectedResult ? RESULT_CODES[selectedResult] : null;
  const selectedColors = selectedInfo ? GROUP_COLORS[selectedInfo.type] : null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: 3,
          mx: 1,
          maxHeight: '92vh',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          pb: 1,
          pt: 2,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            타석 결과 입력
          </Typography>
          {playerName && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              타자: <strong>{playerName}</strong>
            </Typography>
          )}
        </Box>
        <IconButton onClick={handleClose} size="small" edge="end">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 2, pt: 0, pb: 1 }}>
        {/* Inning selector */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>
            이닝
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {Array.from({ length: maxInning }, (_, i) => i + 1).map((n) => (
              <Chip
                key={n}
                label={`${n}회`}
                size="small"
                onClick={() => setSelectedInning(n)}
                color={selectedInning === n ? 'primary' : 'default'}
                sx={{
                  fontWeight: 700,
                  cursor: 'pointer',
                  minWidth: 44,
                  height: 32,
                }}
              />
            ))}
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Result groups */}
        {RESULT_GROUPS.map((group) => {
          const colors = GROUP_COLORS[group.type];
          return (
            <Box key={group.type} sx={{ mb: 1.5 }}>
              <Box
                sx={{
                  bgcolor: colors.headerBg,
                  borderRadius: '8px 8px 0 0',
                  px: 1.5,
                  py: 0.5,
                  mb: 0.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, color: colors.headerText }}
                >
                  {group.label}
                </Typography>
              </Box>
              <Grid container spacing={0.75}>
                {group.codes.map((code) => (
                  <Grid item xs={group.codes.length <= 2 ? 6 : 3} key={code}>
                    <ResultButton
                      code={code}
                      selected={selectedResult === code}
                      onSelect={setSelectedResult}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          );
        })}

        <Divider sx={{ my: 1.5 }} />

        {/* RBI + Run counters */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 0.5 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Counter label="득점" value={run} onChange={setRun} max={4} />
            <Counter label="타점" value={rbi} onChange={setRbi} max={4} />
          </Box>
          {selectedResult && (
            <Chip
              label={`${selectedResult} · ${selectedInfo?.label}`}
              size="small"
              sx={{
                bgcolor: selectedColors?.selectedBg,
                color: '#fff',
                fontWeight: 700,
                fontFamily: '"Roboto Mono", monospace',
              }}
            />
          )}
        </Box>

        {/* Note field */}
        <TextField
          fullWidth
          size="small"
          placeholder="메모 (예: 유격수 방향, 좌중간, 빠른 직구)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          sx={{ mt: 1.5 }}
          inputProps={{ maxLength: 50 }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 2, pb: 2, pt: 1, gap: 1 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          sx={{ flex: 1 }}
        >
          취소
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!selectedResult}
          startIcon={<CheckIcon />}
          sx={{ flex: 2 }}
        >
          기록
        </Button>
      </DialogActions>
    </Dialog>
  );
}
