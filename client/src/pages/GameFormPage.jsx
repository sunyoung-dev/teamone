import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import Checkbox from '@mui/material/Checkbox';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

import { getGame, createGame, updateGame, getPlayers, getLeagues } from '../api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { POSITIONS, POSITION_MAP } from '../utils/constants.js';

const EMPTY_FORM = {
  date: new Date().toISOString().slice(0, 10),
  opponent: '',
  venue: '',
  innings: 7,
  leagueId: '',
  round: '',
};

export default function GameFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [lineup, setLineup] = useState([]);
  const [players, setPlayers] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const promises = [getPlayers(), getLeagues()];
    if (isEdit) promises.push(getGame(id));

    Promise.all(promises)
      .then(([playersRes, leaguesRes, gameRes]) => {
        setPlayers((playersRes.data || []).filter((p) => p.active !== false));
        setLeagues(leaguesRes.data || []);
        if (gameRes) {
          const g = gameRes.data || gameRes;
          setForm({
            date: g.date || '',
            opponent: g.opponent || '',
            venue: g.venue || '',
            innings: g.innings || 7,
            leagueId: g.leagueId || '',
            round: g.round || '',
          });
          setLineup(g.lineup || []);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // Lineup helpers
  const isInLineup = (playerId) => lineup.some((e) => e.playerId === playerId);

  const togglePlayer = (playerId) => {
    if (isInLineup(playerId)) {
      setLineup((prev) => prev.filter((e) => e.playerId !== playerId));
    } else {
      const nextOrder = lineup.length + 1;
      setLineup((prev) => [
        ...prev,
        { playerId, battingOrder: nextOrder, position: players.find((p) => p.id === playerId)?.position || 'DH' },
      ]);
    }
  };

  const updateLineupEntry = (playerId, field, value) => {
    setLineup((prev) =>
      prev.map((e) => (e.playerId === playerId ? { ...e, [field]: value } : e))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        innings: Number(form.innings),
        leagueId: form.leagueId || null,
        round: form.round || '',
        status: isEdit ? undefined : 'scheduled',
        lineup,
      };

      if (isEdit) {
        await updateGame(id, payload);
        navigate(`/games/${id}`);
      } else {
        const res = await createGame(payload);
        const newId = res.data?.id || res.id;
        navigate(`/games/${newId}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const lineupSorted = [...lineup].sort((a, b) => a.battingOrder - b.battingOrder);

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 2, pb: 10 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Game info */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>경기 정보</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="날짜"
                type="date"
                value={form.date}
                onChange={handleChange('date')}
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="상대팀"
                value={form.opponent}
                onChange={handleChange('opponent')}
                fullWidth
                placeholder="예: 블루베리스"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="장소"
                value={form.venue}
                onChange={handleChange('venue')}
                fullWidth
                placeholder="예: 서울 야구장"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>대회</InputLabel>
                <Select value={form.leagueId} onChange={(e) => setForm(p => ({ ...p, leagueId: e.target.value, round: '' }))} label="대회">
                  <MenuItem value="">대회 없음 (자체경기)</MenuItem>
                  {leagues.map(l => (
                    <MenuItem key={l.id} value={l.id}>{l.name} ({l.season})</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {(() => {
              const selectedComp = leagues.find(l => l.id === form.leagueId);
              if (!selectedComp || selectedComp.format !== 'tournament' || !selectedComp.rounds?.length) return null;
              return (
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>라운드</InputLabel>
                    <Select value={form.round} onChange={handleChange('round')} label="라운드">
                      <MenuItem value="">라운드 미정</MenuItem>
                      {selectedComp.rounds.map(r => (
                        <MenuItem key={r} value={r}>{r}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              );
            })()}
            <Grid item xs={12}>
              <TextField
                label="이닝 수"
                type="number"
                value={form.innings}
                onChange={handleChange('innings')}
                fullWidth
                inputProps={{ min: 1, max: 12 }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Lineup builder */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              라인업 ({lineup.length}명)
            </Typography>
          </Box>
          <Divider />

          {/* Current lineup */}
          {lineupSorted.length > 0 && (
            <>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: 40 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>선수</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 110 }}>포지션</TableCell>
                    <TableCell sx={{ width: 40 }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lineupSorted.map((entry, idx) => {
                    const player = players.find((p) => p.id === entry.playerId);
                    return (
                      <TableRow key={entry.playerId}>
                        <TableCell>
                          <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 700, color: 'primary.main' }}>
                            {entry.battingOrder}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            #{player?.number} {player?.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={entry.position}
                            onChange={(e) => updateLineupEntry(entry.playerId, 'position', e.target.value)}
                            size="small"
                            sx={{ fontSize: '0.8rem', minWidth: 90 }}
                          >
                            {POSITIONS.map((pos) => (
                              <MenuItem key={pos.code} value={pos.code} sx={{ fontSize: '0.85rem' }}>
                                {pos.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => togglePlayer(entry.playerId)} color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <Divider />
            </>
          )}

          {/* Available players */}
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              선수 추가 (탭하여 선택)
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, px: 2, pb: 2 }}>
            {players.map((player) => {
              const inLineup = isInLineup(player.id);
              return (
                <Chip
                  key={player.id}
                  label={`#${player.number} ${player.name}`}
                  onClick={() => togglePlayer(player.id)}
                  color={inLineup ? 'primary' : 'default'}
                  variant={inLineup ? 'filled' : 'outlined'}
                  sx={{ fontWeight: 600, cursor: 'pointer' }}
                />
              );
            })}
          </Box>
        </CardContent>
      </Card>

      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        size="large"
        disabled={saving}
      >
        {saving ? '저장 중...' : isEdit ? '수정 완료' : '경기 등록'}
      </Button>
    </Box>
  );
}
