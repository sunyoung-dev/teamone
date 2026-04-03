import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { addPitching, deletePitching } from '../../api.js';

export default function PitchingTab({ gameId, game, players, pitchingRecords, opponentAtBats, onPitchingAdded, onPitchingDeleted }) {
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
      onPitchingAdded(res.data || { ...newRecord, id: Date.now().toString() });
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

  const inningPitcherMap = {};
  pitchingRecords.forEach((rec) => {
    for (let inn = rec.startInning; inn <= rec.endInning; inn++) {
      inningPitcherMap[inn] = rec.pitcherId;
    }
  });

  const lineupPitcherId = pitchingRecords.length === 0
    ? ((game?.lineup || []).find((e) => e.position === 'P')?.playerId || null)
    : null;

  const pitcherStatsMap = {};
  opponentAtBats.forEach((ab) => {
    const rawId = ab.pitcherId;
    const explicitId = (rawId && rawId !== 'undefined' && rawId !== 'null') ? rawId : '';
    const pid = explicitId || inningPitcherMap[ab.inning] || lineupPitcherId;
    if (!pid) return;
    if (!pitcherStatsMap[pid]) {
      pitcherStatsMap[pid] = { H: 0, K: 0, BB: 0, R: 0, autoPitches: 0, hasAllPitches: true };
    }
    const s = pitcherStatsMap[pid];
    if (['1H', '2H', '3H', 'HR'].includes(ab.result)) s.H += 1;
    if (ab.result === 'SO') s.K += 1;
    if (ab.result === 'BB' || ab.result === 'HBP') s.BB += 1;
    s.R += ab.run || 0;
    if (ab.pitches != null) {
      s.autoPitches += ab.pitches;
    } else {
      s.hasAllPitches = false;
    }
  });

  const calcIP = (rec) => {
    const full = rec.endInning - rec.startInning + 1;
    return full > 0 ? full : 0;
  };

  const inningRanges = Array.from({ length: 9 }, (_, i) => i + 1);

  return (
    <Box sx={{ pb: 2 }}>
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
                        {rec.pitchCount != null ? (
                          <Typography sx={{ fontFamily: '"Roboto Mono", monospace' }}>
                            {rec.pitchCount}
                          </Typography>
                        ) : stats.hasAllPitches && stats.autoPitches > 0 ? (
                          <Typography sx={{ fontFamily: '"Roboto Mono", monospace', color: 'text.secondary', fontStyle: 'italic' }}>
                            {stats.autoPitches}
                          </Typography>
                        ) : (
                          <Typography sx={{ fontFamily: '"Roboto Mono", monospace' }}>-</Typography>
                        )}
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
