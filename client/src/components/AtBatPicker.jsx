import React, { useState, useEffect } from 'react';
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
import { calcPitches, autoCorrectCount } from '../utils/pitchCount.js';

const GROUP_COLORS = {
  hit: {
    bg: '#f0fdf4', selectedBg: '#1b5e20', border: '#4c8c4a',
    text: '#1b5e20', selectedText: '#ffffff', headerBg: '#dcfce7', headerText: '#1b5e20',
  },
  out: {
    bg: '#fff1f2', selectedBg: '#b71c1c', border: '#e05252',
    text: '#b71c1c', selectedText: '#ffffff', headerBg: '#fee2e2', headerText: '#b71c1c',
  },
  onBase: {
    bg: '#eff6ff', selectedBg: '#1565c0', border: '#4f83cc',
    text: '#003c8f', selectedText: '#ffffff', headerBg: '#dbeafe', headerText: '#003c8f',
  },
  sacrifice: {
    bg: '#f8fafc', selectedBg: '#475569', border: '#94a3b8',
    text: '#334155', selectedText: '#ffffff', headerBg: '#e2e8f0', headerText: '#334155',
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
        minHeight: 64, flexDirection: 'column', gap: 0.25, p: 0.75, borderRadius: 2,
        border: `2px solid ${colors.border}`,
        bgcolor: selected ? colors.selectedBg : colors.bg,
        color: selected ? colors.selectedText : colors.text,
        '&:hover': { bgcolor: selected ? colors.selectedBg : colors.border, color: colors.selectedText, borderColor: colors.border },
        transition: 'all 0.15s ease',
        boxShadow: selected ? '0 2px 8px rgba(0,0,0,0.25)' : 'none',
      }}
    >
      <Typography variant="body1" sx={{ fontWeight: 800, fontSize: '1rem', fontFamily: '"Roboto Mono", monospace', lineHeight: 1 }}>
        {code}
      </Typography>
      <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 600, lineHeight: 1, opacity: 0.9 }}>
        {info?.label}
      </Typography>
    </Button>
  );
}

function Counter({ label, value, onChange, min = 0, max = 9 }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 32 }}>{label}</Typography>
      <IconButton size="small" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} sx={{ bgcolor: 'grey.100', width: 36, height: 36 }}>
        <RemoveIcon fontSize="small" />
      </IconButton>
      <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 700, fontSize: '1.25rem', minWidth: 28, textAlign: 'center' }}>
        {value}
      </Typography>
      <IconButton size="small" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} sx={{ bgcolor: 'grey.100', width: 36, height: 36 }}>
        <AddIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

// 도트 탭으로 볼/스트라이크 수 선택하는 컴포넌트
function CountDots({ value, max, filledColor, emptyColor, onChange, disabled }) {
  return (
    <Box sx={{ display: 'flex', gap: 0.75 }}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i < value;
        return (
          <Box
            key={i}
            onClick={() => !disabled && onChange(value === i + 1 ? i : i + 1)}
            sx={{
              width: 28, height: 28, borderRadius: '50%',
              bgcolor: filled ? filledColor : emptyColor,
              border: `2px solid ${filled ? filledColor : '#cbd5e1'}`,
              cursor: disabled ? 'default' : 'pointer',
              transition: 'all 0.12s',
              opacity: disabled ? 0.4 : 1,
              '&:active': disabled ? {} : { transform: 'scale(0.88)' },
            }}
          />
        );
      })}
    </Box>
  );
}

// 볼 카운트 입력 섹션 (볼/스트라이크/파울 + 자동 투구수)
function BallCountSection({ balls, strikes, fouls, result, onBallsChange, onStrikesChange, onFoulsChange }) {
  const isHbp = result === 'HBP';
  const isBb  = result === 'BB';
  const isSo  = result === 'SO';

  const pitches = calcPitches(balls, strikes, fouls, result);

  return (
    <Box sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 1.5 }}>
      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1, display: 'block' }}>
        볼 카운트
        {isHbp && (
          <Typography component="span" variant="caption" sx={{ ml: 1, color: 'info.main' }}>
            (사구 — 1구 자동)
          </Typography>
        )}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, opacity: isHbp ? 0.45 : 1 }}>
        {/* 볼 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 36, color: '#1565c0' }}>볼</Typography>
          <CountDots
            value={balls ?? 0}
            max={3}
            filledColor="#1565c0"
            emptyColor="#dbeafe"
            onChange={isBb ? undefined : onBallsChange}
            disabled={isHbp || isBb}
          />
          {isBb && (
            <Typography variant="caption" sx={{ color: 'info.main', fontWeight: 600 }}>3 고정</Typography>
          )}
        </Box>

        {/* 스트라이크 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 36, color: '#b71c1c' }}>스트</Typography>
          <CountDots
            value={strikes ?? 0}
            max={2}
            filledColor="#b71c1c"
            emptyColor="#fee2e2"
            onChange={isSo ? undefined : onStrikesChange}
            disabled={isHbp || isSo}
          />
          {isSo && (
            <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600 }}>2 고정</Typography>
          )}
        </Box>

        {/* 파울 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 36, color: 'text.secondary' }}>파울</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <IconButton
              size="small"
              onClick={() => onFoulsChange(Math.max(0, fouls - 1))}
              disabled={isHbp || fouls <= 0}
              sx={{ bgcolor: 'grey.200', width: 28, height: 28 }}
            >
              <RemoveIcon sx={{ fontSize: 14 }} />
            </IconButton>
            <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 700, minWidth: 20, textAlign: 'center' }}>
              {fouls}
            </Typography>
            <IconButton
              size="small"
              onClick={() => onFoulsChange(fouls + 1)}
              disabled={isHbp}
              sx={{ bgcolor: 'grey.200', width: 28, height: 28 }}
            >
              <AddIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* 자동 계산된 투구수 */}
      <Box sx={{ mt: 1.25, pt: 1, borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="caption" color="text.secondary">투구수</Typography>
        <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 800, fontSize: '1.1rem', color: pitches != null ? 'text.primary' : 'text.disabled' }}>
          {pitches != null ? `${pitches}구` : '–'}
        </Typography>
        {pitches != null && balls != null && strikes != null && !isHbp && (
          <Typography variant="caption" color="text.disabled">
            = {balls}볼+{strikes}스트+{fouls}파울+1
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default function AtBatPicker({
  open, onClose, onConfirm, playerName, inning, maxInning = 9,
  initialResult = null, initialInning = null, initialRbi = 0,
}) {
  const [selectedResult, setSelectedResult] = useState(initialResult);
  const [selectedInning, setSelectedInning] = useState(initialInning || inning || 1);
  const [rbi, setRbi] = useState(initialRbi);
  const [run, setRun] = useState(0);
  const [note, setNote] = useState('');
  const [balls, setBalls] = useState(null);
  const [strikes, setStrikes] = useState(null);
  const [fouls, setFouls] = useState(0);

  useEffect(() => {
    if (open) {
      setSelectedInning(initialInning || inning || 1);
      setSelectedResult(initialResult);
      setRbi(initialRbi);
      setRun(0);
      setNote('');
      setBalls(null);
      setStrikes(null);
      setFouls(0);
    }
  }, [open]);

  // 결과 변경 시 볼/스트 자동 보정
  const handleResultSelect = (code) => {
    setSelectedResult(code);
    if (code === 'BB') {
      setBalls(3);
    } else if (code === 'SO') {
      setStrikes(2);
    }
  };

  const handleConfirm = () => {
    if (!selectedResult) return;
    const { balls: b, strikes: s } = autoCorrectCount(balls ?? 0, strikes ?? 0, selectedResult);
    const pitches = calcPitches(b, s, fouls, selectedResult);
    onConfirm({ result: selectedResult, inning: selectedInning, rbi, run, note, balls: b, strikes: s, fouls, pitches });
  };

  const handleClose = () => {
    setSelectedResult(initialResult);
    setSelectedInning(initialInning || inning || 1);
    setRbi(initialRbi);
    setRun(0);
    setNote('');
    setBalls(null);
    setStrikes(null);
    setFouls(0);
    onClose();
  };

  const selectedInfo = selectedResult ? RESULT_CODES[selectedResult] : null;
  const selectedColors = selectedInfo ? GROUP_COLORS[selectedInfo.type] : null;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3, mx: 1, maxHeight: '92vh' } }}>
      <DialogTitle sx={{ pb: 1, pt: 2, px: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>타석 결과 입력</Typography>
          {playerName && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              타자: <strong>{playerName}</strong>
            </Typography>
          )}
        </Box>
        <IconButton onClick={handleClose} size="small" edge="end"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 2, pt: 0, pb: 1 }}>
        {/* 이닝 선택 */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>이닝</Typography>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {Array.from({ length: maxInning }, (_, i) => i + 1).map((n) => (
              <Chip key={n} label={`${n}회`} size="small" onClick={() => setSelectedInning(n)}
                color={selectedInning === n ? 'primary' : 'default'}
                sx={{ fontWeight: 700, cursor: 'pointer', minWidth: 44, height: 32 }}
              />
            ))}
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* 결과 버튼 그룹 */}
        {RESULT_GROUPS.map((group) => {
          const colors = GROUP_COLORS[group.type];
          return (
            <Box key={group.type} sx={{ mb: 1.5 }}>
              <Box sx={{ bgcolor: colors.headerBg, borderRadius: '8px 8px 0 0', px: 1.5, py: 0.5, mb: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: colors.headerText }}>{group.label}</Typography>
              </Box>
              <Grid container spacing={0.75}>
                {group.codes.map((code) => (
                  <Grid item xs={group.codes.length <= 2 ? 6 : 3} key={code}>
                    <ResultButton code={code} selected={selectedResult === code} onSelect={handleResultSelect} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          );
        })}

        <Divider sx={{ my: 1.5 }} />

        {/* 볼 카운트 섹션 */}
        <BallCountSection
          balls={balls}
          strikes={strikes}
          fouls={fouls}
          result={selectedResult}
          onBallsChange={setBalls}
          onStrikesChange={setStrikes}
          onFoulsChange={setFouls}
        />

        <Divider sx={{ my: 1.5 }} />

        {/* 득점 / 타점 */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 0.5 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Counter label="득점" value={run} onChange={setRun} max={4} />
            <Counter label="타점" value={rbi} onChange={setRbi} max={4} />
          </Box>
          {selectedResult && (
            <Chip
              label={`${selectedResult} · ${selectedInfo?.label}`}
              size="small"
              sx={{ bgcolor: selectedColors?.selectedBg, color: '#fff', fontWeight: 700, fontFamily: '"Roboto Mono", monospace' }}
            />
          )}
        </Box>

        {/* 메모 */}
        <TextField
          fullWidth size="small"
          placeholder="메모 (예: 유격수 방향, 좌중간, 빠른 직구)"
          value={note} onChange={(e) => setNote(e.target.value)}
          sx={{ mt: 1.5 }} inputProps={{ maxLength: 50 }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 2, pb: 2, pt: 1, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" sx={{ flex: 1 }}>취소</Button>
        <Button onClick={handleConfirm} variant="contained" disabled={!selectedResult} startIcon={<CheckIcon />} sx={{ flex: 2 }}>
          기록
        </Button>
      </DialogActions>
    </Dialog>
  );
}
