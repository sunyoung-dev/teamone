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
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import {
  RESULT_GROUPS, RESULT_CODES, RESULT_TYPE_COLORS,
  HIT_TYPES, HIT_DIRECTIONS, FIELDER_POSITIONS,
  RESULT_SHOWS_BATTED_BALL, RESULT_SHOWS_FIELDERS,
} from '../../utils/constants.js';
import { calcPitches, autoCorrectCount } from '../../utils/pitchCount.js';

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
        minHeight: 58, flexDirection: 'column', gap: 0.2, p: 0.5, borderRadius: 2,
        border: `2px solid ${colors.border}`,
        bgcolor: selected ? colors.selectedBg : colors.bg,
        color: selected ? colors.selectedText : colors.text,
        '&:hover': { bgcolor: selected ? colors.selectedBg : colors.border, color: colors.selectedText },
        transition: 'all 0.12s ease',
        boxShadow: selected ? '0 2px 8px rgba(0,0,0,0.25)' : 'none',
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.85rem', fontFamily: '"Roboto Mono", monospace', lineHeight: 1 }}>
        {code}
      </Typography>
      <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 600, lineHeight: 1, opacity: 0.9 }}>
        {info?.label}
      </Typography>
    </Button>
  );
}

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
              width: 26, height: 26, borderRadius: '50%',
              bgcolor: filled ? filledColor : emptyColor,
              border: `2px solid ${filled ? filledColor : '#cbd5e1'}`,
              cursor: disabled ? 'default' : 'pointer',
              transition: 'all 0.12s',
              opacity: disabled ? 0.4 : 1,
            }}
          />
        );
      })}
    </Box>
  );
}

function SectionLabel({ children }) {
  return (
    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.75, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
      {children}
    </Typography>
  );
}

// 수비수 포지션 선택 (1~9번)
function FielderPicker({ value, onChange }) {
  const toggle = (num) => {
    if (value.includes(num)) {
      onChange(value.filter(n => n !== num));
    } else {
      onChange([...value, num]);
    }
  };

  return (
    <Box>
      <SectionLabel>관여 수비수 (복수 선택)</SectionLabel>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.5 }}>
        {FIELDER_POSITIONS.map(({ num, code, label }) => {
          const selected = value.includes(num);
          return (
            <Button
              key={num}
              onClick={() => toggle(num)}
              variant={selected ? 'contained' : 'outlined'}
              size="small"
              sx={{
                flexDirection: 'column', gap: 0, py: 0.5, px: 0.25, minHeight: 48,
                bgcolor: selected ? '#0d1b3e' : 'grey.50',
                color: selected ? '#fff' : 'text.primary',
                borderColor: selected ? '#0d1b3e' : 'divider',
                fontFamily: '"Roboto Mono", monospace',
                '&:hover': { bgcolor: selected ? '#1a2d5a' : 'grey.100' },
              }}
            >
              <Typography sx={{ fontWeight: 800, fontSize: '1rem', lineHeight: 1, fontFamily: 'inherit' }}>
                {num}
              </Typography>
              <Typography sx={{ fontSize: '0.55rem', fontWeight: 600, lineHeight: 1, opacity: 0.8 }}>
                {code}
              </Typography>
            </Button>
          );
        })}
      </Box>
      {value.length > 0 && (
        <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="caption" color="text.secondary">선택:</Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, fontFamily: '"Roboto Mono", monospace' }}>
            {value.join('-')}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

// 타구 방향 선택 (시각적 야구장 방향 5분할)
function DirectionPicker({ value, onChange }) {
  const mainDirs = HIT_DIRECTIONS.filter(d => ['LL', 'LC', 'C', 'RC', 'RR'].includes(d.code));
  const innerDirs = HIT_DIRECTIONS.filter(d => ['3B', 'P', '1B'].includes(d.code));

  return (
    <Box>
      <SectionLabel>타구 방향</SectionLabel>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {/* 외야 방향 */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {mainDirs.map(dir => (
            <Button
              key={dir.code}
              onClick={() => onChange(value === dir.code ? null : dir.code)}
              variant={value === dir.code ? 'contained' : 'outlined'}
              size="small"
              sx={{
                flex: 1, minHeight: 36, px: 0.25,
                bgcolor: value === dir.code ? '#1565c0' : 'grey.50',
                color: value === dir.code ? '#fff' : 'text.primary',
                borderColor: value === dir.code ? '#1565c0' : 'divider',
                fontSize: '0.65rem', fontWeight: 700,
              }}
            >
              {dir.shortLabel}
            </Button>
          ))}
        </Box>
        {/* 내야 방향 */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {innerDirs.map(dir => (
            <Button
              key={dir.code}
              onClick={() => onChange(value === dir.code ? null : dir.code)}
              variant={value === dir.code ? 'contained' : 'outlined'}
              size="small"
              sx={{
                flex: 1, minHeight: 32, px: 0.25,
                bgcolor: value === dir.code ? '#1565c0' : 'grey.50',
                color: value === dir.code ? '#fff' : 'text.primary',
                borderColor: value === dir.code ? '#1565c0' : 'divider',
                fontSize: '0.65rem', fontWeight: 700,
              }}
            >
              {dir.label}
            </Button>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export default function EnhancedAtBatModal({
  open, onClose, onConfirm,
  playerName, inning, maxInning = 9,
  initialResult = null, initialInning = null,
  initialData = null,
}) {
  const [selectedResult, setSelectedResult] = useState(initialResult);
  const [selectedInning, setSelectedInning] = useState(initialInning || inning || 1);
  const [note, setNote] = useState('');
  const [balls, setBalls] = useState(null);
  const [strikes, setStrikes] = useState(null);
  const [fouls, setFouls] = useState(0);
  // 기록원 확장 필드
  const [hitType, setHitType] = useState(null);
  const [hitDirection, setHitDirection] = useState(null);
  const [fielders, setFielders] = useState([]);
  const [isEarnedRun, setIsEarnedRun] = useState(null);

  useEffect(() => {
    if (open) {
      setSelectedInning(initialInning || inning || 1);
      setSelectedResult(initialData?.result || initialResult);
      setNote(initialData?.note || '');
      setBalls(initialData?.balls ?? null);
      setStrikes(initialData?.strikes ?? null);
      setFouls(initialData?.fouls ?? 0);
      setHitType(initialData?.hitType || null);
      setHitDirection(initialData?.hitDirection || null);
      setFielders(initialData?.fielders || []);
      setIsEarnedRun(initialData?.isEarnedRun ?? null);
    }
  }, [open]);

  const handleResultSelect = (code) => {
    setSelectedResult(code);
    if (code === 'BB' || code === 'IBB') setBalls(3);
    else if (code === 'SO') setStrikes(2);
    // 결과가 바뀌면 타구 관련 필드 초기화
    setHitType(null);
    setHitDirection(null);
    setFielders([]);
  };

  const handleConfirm = () => {
    if (!selectedResult) return;
    const { balls: b, strikes: s } = autoCorrectCount(balls ?? 0, strikes ?? 0, selectedResult);
    const pitches = calcPitches(b, s, fouls, selectedResult);
    onConfirm({
      result: selectedResult,
      inning: selectedInning,
      note,
      balls: b,
      strikes: s,
      fouls,
      pitches,
      hitType: hitType || null,
      hitDirection: hitDirection || null,
      fielders,
      isEarnedRun,
    });
  };

  const handleClose = () => {
    onClose();
  };

  const showBattedBall = selectedResult && RESULT_SHOWS_BATTED_BALL.has(selectedResult);
  const showFielders = selectedResult && RESULT_SHOWS_FIELDERS.has(selectedResult);
  const isHbp = selectedResult === 'HBP' || selectedResult === 'CI';
  const isBb = selectedResult === 'BB' || selectedResult === 'IBB';
  const isSo = selectedResult === 'SO';
  const pitches = selectedResult ? calcPitches(balls ?? 0, strikes ?? 0, fouls, selectedResult) : null;
  const selectedInfo = selectedResult ? RESULT_CODES[selectedResult] : null;
  const selectedColors = selectedInfo ? GROUP_COLORS[selectedInfo.type] : null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{ sx: { borderRadius: 3, mx: 1, maxHeight: '96vh' } }}
    >
      <DialogTitle sx={{ pb: 1, pt: 2, px: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, fontSize: '1rem' }}>
            타석 기록 (기록원)
          </Typography>
          {playerName && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              타자: <strong>{playerName}</strong>
            </Typography>
          )}
        </Box>
        <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 2, pt: 0, pb: 1 }}>
        {/* 이닝 선택 */}
        <Box sx={{ mb: 1.5 }}>
          <SectionLabel>이닝</SectionLabel>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {Array.from({ length: maxInning }, (_, i) => i + 1).map((n) => (
              <Chip
                key={n}
                label={`${n}회`}
                size="small"
                onClick={() => setSelectedInning(n)}
                color={selectedInning === n ? 'primary' : 'default'}
                sx={{ fontWeight: 700, cursor: 'pointer', minWidth: 40, height: 28 }}
              />
            ))}
          </Box>
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        {/* 결과 코드 선택 */}
        {RESULT_GROUPS.map((group) => {
          const colors = GROUP_COLORS[group.type];
          const colCount = group.codes.length <= 3 ? group.codes.length : 4;
          return (
            <Box key={group.type} sx={{ mb: 1.25 }}>
              <Box sx={{ bgcolor: colors.headerBg, borderRadius: '6px 6px 0 0', px: 1.5, py: 0.4, mb: 0.4 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: colors.headerText }}>
                  {group.label}
                </Typography>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${colCount}, 1fr)`, gap: 0.5 }}>
                {group.codes.map((code) => (
                  <ResultButton
                    key={code}
                    code={code}
                    selected={selectedResult === code}
                    onSelect={handleResultSelect}
                  />
                ))}
              </Box>
            </Box>
          );
        })}

        <Divider sx={{ my: 1.25 }} />

        {/* 볼 카운트 */}
        <Box sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 1.25, mb: 1.25 }}>
          <SectionLabel>볼 카운트</SectionLabel>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, opacity: isHbp ? 0.45 : 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 36, color: '#1565c0' }}>볼</Typography>
              <CountDots value={balls ?? 0} max={3} filledColor="#1565c0" emptyColor="#dbeafe"
                onChange={isBb ? undefined : setBalls} disabled={isHbp || isBb} />
              {isBb && <Typography variant="caption" sx={{ color: 'info.main', fontWeight: 600 }}>3 고정</Typography>}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 36, color: '#b71c1c' }}>스트</Typography>
              <CountDots value={strikes ?? 0} max={2} filledColor="#b71c1c" emptyColor="#fee2e2"
                onChange={isSo ? undefined : setStrikes} disabled={isHbp || isSo} />
              {isSo && <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600 }}>2 고정</Typography>}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 36, color: 'text.secondary' }}>파울</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconButton size="small" onClick={() => setFouls(Math.max(0, fouls - 1))} disabled={isHbp || fouls <= 0} sx={{ bgcolor: 'grey.200', width: 26, height: 26 }}>
                  <RemoveIcon sx={{ fontSize: 13 }} />
                </IconButton>
                <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{fouls}</Typography>
                <IconButton size="small" onClick={() => setFouls(fouls + 1)} disabled={isHbp} sx={{ bgcolor: 'grey.200', width: 26, height: 26 }}>
                  <AddIcon sx={{ fontSize: 13 }} />
                </IconButton>
              </Box>
            </Box>
          </Box>
          <Box sx={{ mt: 1, pt: 0.75, borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">투구수</Typography>
            <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 800, fontSize: '1rem', color: pitches != null ? 'text.primary' : 'text.disabled' }}>
              {pitches != null ? `${pitches}구` : '–'}
            </Typography>
          </Box>
        </Box>

        {/* 타구 유형 + 방향 (해당 결과일 때만 표시) */}
        {showBattedBall && (
          <>
            <Divider sx={{ mb: 1.25 }} />
            <Box sx={{ bgcolor: '#f8fafc', borderRadius: 2, p: 1.25, mb: 1.25 }}>
              <Box sx={{ mb: 1 }}>
                <SectionLabel>타구 유형</SectionLabel>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.5 }}>
                  {HIT_TYPES.map(ht => (
                    <Button
                      key={ht.code}
                      onClick={() => setHitType(hitType === ht.code ? null : ht.code)}
                      variant={hitType === ht.code ? 'contained' : 'outlined'}
                      size="small"
                      sx={{
                        flexDirection: 'column', gap: 0, minHeight: 44,
                        bgcolor: hitType === ht.code ? '#334155' : 'white',
                        color: hitType === ht.code ? '#fff' : 'text.primary',
                        borderColor: hitType === ht.code ? '#334155' : 'divider',
                        '&:hover': { bgcolor: hitType === ht.code ? '#475569' : 'grey.100' },
                      }}
                    >
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, fontFamily: '"Roboto Mono", monospace', lineHeight: 1 }}>
                        {ht.code}
                      </Typography>
                      <Typography sx={{ fontSize: '0.55rem', fontWeight: 600, lineHeight: 1, opacity: 0.8 }}>
                        {ht.label}
                      </Typography>
                    </Button>
                  ))}
                </Box>
              </Box>
              <DirectionPicker value={hitDirection} onChange={setHitDirection} />
            </Box>
          </>
        )}

        {/* 수비수 포지션 (아웃 결과일 때) */}
        {showFielders && (
          <Box sx={{ bgcolor: '#f0f4ff', borderRadius: 2, p: 1.25, mb: 1.25 }}>
            <FielderPicker value={fielders} onChange={setFielders} />
          </Box>
        )}

        {/* 자책점 여부 */}
        {selectedResult && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 60 }}>자책점</Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {[{ val: true, label: '자책' }, { val: false, label: '비자책' }, { val: null, label: '미지정' }].map(opt => (
                <Button
                  key={String(opt.val)}
                  size="small"
                  variant={isEarnedRun === opt.val ? 'contained' : 'outlined'}
                  onClick={() => setIsEarnedRun(opt.val)}
                  sx={{
                    fontSize: '0.7rem', px: 1, py: 0.25, minHeight: 28,
                    bgcolor: isEarnedRun === opt.val ? '#0d1b3e' : 'white',
                    color: isEarnedRun === opt.val ? '#fff' : 'text.secondary',
                    borderColor: isEarnedRun === opt.val ? '#0d1b3e' : 'divider',
                  }}
                >
                  {opt.label}
                </Button>
              ))}
            </Box>
          </Box>
        )}

        {/* 결과 표시 */}
        {selectedResult && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5 }}>
            <Chip
              label={`${selectedResult} · ${selectedInfo?.label}`}
              size="small"
              sx={{ bgcolor: selectedColors?.selectedBg, color: '#fff', fontWeight: 700, fontFamily: '"Roboto Mono", monospace' }}
            />
          </Box>
        )}

        {/* 메모 */}
        <TextField
          fullWidth size="small"
          placeholder="메모 (예: 6-4-3 병살, 좌중간 장타)"
          value={note} onChange={(e) => setNote(e.target.value)}
          inputProps={{ maxLength: 80 }}
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
