import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

import { getTeamStats, getAllPlayerStats, getPitchingStats } from '../api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { formatAvg, formatOps } from '../utils/statsCalculator.js';

const COLUMNS = [
  { id: 'name', label: '선수명', numeric: false, width: 80 },
  { id: 'avg', label: '타율', numeric: true, format: formatAvg },
  { id: 'obp', label: '출루율', numeric: true, format: formatAvg },
  { id: 'slg', label: '장타율', numeric: true, format: formatAvg },
  { id: 'ops', label: 'OPS', numeric: true, format: formatOps },
  { id: 'ab', label: '타수', numeric: true },
  { id: 'hits', label: '안타', numeric: true },
  { id: 'homeRuns', label: '홈런', numeric: true },
];

function TeamSummary({ stats }) {
  if (!stats) return null;
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <TrendingUpIcon color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>팀 통계 요약</Typography>
        </Box>
        <Grid container spacing={1}>
          {[
            { label: '팀타율', value: formatAvg(stats.teamAvg ?? stats.avg) },
            { label: '팀출루율', value: formatAvg(stats.teamObp ?? stats.obp) },
            { label: '팀장타율', value: formatAvg(stats.teamSlg ?? stats.slg) },
            { label: '팀OPS', value: formatOps(stats.teamOps ?? stats.ops) },
          ].map((item) => (
            <Grid item xs={3} key={item.label}>
              <Box sx={{ textAlign: 'center', bgcolor: 'background.default', borderRadius: 2, py: 1 }}>
                <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 700, fontSize: '1rem', color: 'primary.main' }}>
                  {item.value}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                  {item.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
        <Divider sx={{ my: 1.5 }} />
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary">
            경기수: <strong>{stats.gamesPlayed ?? 0}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            승: <strong style={{ color: '#2e7d32' }}>{stats.wins ?? 0}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            패: <strong style={{ color: '#c62828' }}>{stats.losses ?? 0}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            무: <strong>{stats.draws ?? 0}</strong>
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function StatsPage() {
  const navigate = useNavigate();
  const [teamStats, setTeamStats] = useState(null);
  const [playerStatsList, setPlayerStatsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pitchingStats, setPitchingStats] = useState([]);
  const [orderBy, setOrderBy] = useState('avg');
  const [order, setOrder] = useState('desc');

  useEffect(() => {
    Promise.all([getTeamStats(), getAllPlayerStats(), getPitchingStats()])
      .then(([tsRes, allStatsRes, pitchingRes]) => {
        setTeamStats(tsRes.data || tsRes);
        setPitchingStats(pitchingRes.data || []);
        const allStats = allStatsRes.data || [];
        const merged = allStats
          .filter((s) => s.gamesPlayed > 0 || s.atBats > 0)
          .map((s) => ({
            playerId: s.playerId,
            name: s.playerName,
            number: s.number,
            position: s.position,
            avg: s.avg ?? 0,
            obp: s.obp ?? 0,
            slg: s.slg ?? 0,
            ops: s.ops ?? 0,
            ab: s.atBats ?? 0,
            hits: s.hits ?? 0,
            homeRuns: s.homeRuns ?? 0,
            plateAppearances: s.plateAppearances ?? 0,
          }));
        setPlayerStatsList(merged);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (colId) => {
    if (orderBy === colId) {
      setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setOrderBy(colId);
      setOrder('desc');
    }
  };

  const sorted = [...playerStatsList].sort((a, b) => {
    const aVal = a[orderBy] ?? 0;
    const bVal = b[orderBy] ?? 0;
    if (typeof aVal === 'string') return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    return order === 'asc' ? aVal - bVal : bVal - aVal;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <Box sx={{ p: 2, pb: 4 }}>
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      <TeamSummary stats={teamStats} />

      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>선수별 타격 통계</Typography>

      <Card sx={{ mb: 2 }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 500 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                {COLUMNS.map((col) => (
                  <TableCell
                    key={col.id}
                    align={col.numeric ? 'center' : 'left'}
                    sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.25, whiteSpace: 'nowrap' }}
                    sortDirection={orderBy === col.id ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === col.id}
                      direction={orderBy === col.id ? order : 'desc'}
                      onClick={() => handleSort(col.id)}
                    >
                      {col.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={COLUMNS.length} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    통계 데이터가 없습니다
                  </TableCell>
                </TableRow>
              )}
              {sorted.map((row, idx) => (
                <TableRow
                  key={row.playerId}
                  hover
                  onClick={() => navigate(`/players/${row.playerId}`)}
                  sx={{ cursor: 'pointer', '&:last-child td': { borderBottom: 0 } }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="caption" sx={{ fontFamily: '"Roboto Mono", monospace', color: 'text.secondary', minWidth: 20 }}>
                        #{row.number}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.name}</Typography>
                    </Box>
                  </TableCell>
                  {COLUMNS.slice(1).map((col) => (
                    <TableCell key={col.id} align="center">
                      <Typography
                        sx={{
                          fontFamily: '"Roboto Mono", monospace',
                          fontWeight: col.id === 'avg' ? 700 : 400,
                          fontSize: '0.85rem',
                          color: col.id === 'avg' ? 'primary.main' : 'text.primary',
                        }}
                      >
                        {col.format ? col.format(row[col.id]) : (row[col.id] ?? 0)}
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {pitchingStats.filter((r) => r.games > 0).length > 0 && (
        <>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, mt: 2 }}>투수 통계</Typography>
          <Card>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 480 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'background.default' }}>
                    {['선수명', '경기', 'IP', '피안타', '탈삼진', '볼넷', '실점', 'ERA'].map((label) => (
                      <TableCell key={label} align={label === '선수명' ? 'left' : 'center'} sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.25, whiteSpace: 'nowrap' }}>
                        {label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pitchingStats.filter((r) => r.games > 0).map((row) => (
                    <TableRow key={row.playerId} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="caption" sx={{ fontFamily: '"Roboto Mono", monospace', color: 'text.secondary', minWidth: 20 }}>
                            #{row.number}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.playerName}</Typography>
                        </Box>
                      </TableCell>
                      {[
                        { val: row.games ?? 0 },
                        { val: row.ip ?? 0 },
                        { val: row.h ?? 0 },
                        { val: row.so ?? 0 },
                        { val: row.bb ?? 0 },
                        { val: row.r ?? 0 },
                        { val: row.era != null ? row.era.toFixed(2) : '0.00', highlight: true },
                      ].map((cell, i) => (
                        <TableCell key={i} align="center">
                          <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: cell.highlight ? 700 : 400, fontSize: '0.85rem', color: cell.highlight ? 'primary.main' : 'text.primary' }}>
                            {cell.val}
                          </Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </>
      )}
    </Box>
  );
}
