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
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SportsBaseballIcon from '@mui/icons-material/SportsBaseball';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';

import { getTeamStats, getAllPlayerStats, getPitchingStats, getBaserunningStats } from '../api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtAvg(v) {
  if (v == null || isNaN(v)) return '.000';
  return v.toFixed(3).replace(/^0/, '');
}

function fmtPct(v) {
  if (v == null || isNaN(v)) return '—';
  return (v * 100).toFixed(1) + '%';
}

function fmtWpct(v) {
  if (v == null) return '—';
  return v.toFixed(3).replace(/^0/, '');
}

function fmtEra(v) {
  if (v == null || isNaN(v)) return '0.00';
  return v.toFixed(2);
}

function fmtWhip(v) {
  if (v == null || isNaN(v)) return '0.00';
  return v.toFixed(2);
}

function fmtNum(v) {
  return v ?? 0;
}

// ─── TeamSummary ──────────────────────────────────────────────────────────────

function TeamSummary({ stats }) {
  if (!stats) return null;
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <TrendingUpIcon color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>팀 통계 요약</Typography>
        </Box>
        <Grid container spacing={1} sx={{ mb: 1.5 }}>
          {[
            { label: '경기', value: fmtNum(stats.gamesPlayed) },
            { label: '승', value: fmtNum(stats.wins), color: '#1b5e20' },
            { label: '패', value: fmtNum(stats.losses), color: '#b71c1c' },
            { label: '무', value: fmtNum(stats.draws) },
            { label: '득점', value: fmtNum(stats.runsScored), color: '#1565c0' },
            { label: '실점', value: fmtNum(stats.runsAllowed), color: '#b71c1c' },
          ].map((item) => (
            <Grid item xs={2} key={item.label}>
              <Box sx={{ textAlign: 'center', bgcolor: 'background.default', borderRadius: 2, py: 0.75 }}>
                <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 700, fontSize: '1rem', color: item.color || 'text.primary' }}>
                  {item.value}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                  {item.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
        <Divider sx={{ my: 1 }} />
        <Grid container spacing={1}>
          {[
            { label: '팀타율', value: fmtAvg(stats.teamAvg) },
            { label: '팀출루율', value: fmtAvg(stats.teamObp) },
            { label: '팀장타율', value: fmtAvg(stats.teamSlg) },
            { label: '팀OPS', value: fmtAvg(stats.teamOps) },
          ].map((item) => (
            <Grid item xs={3} key={item.label}>
              <Box sx={{ textAlign: 'center', bgcolor: 'background.default', borderRadius: 2, py: 0.75 }}>
                <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 700, fontSize: '0.95rem', color: 'primary.main' }}>
                  {item.value}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                  {item.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}

// ─── SortableTable ────────────────────────────────────────────────────────────

function SortableTable({ columns, rows, defaultSortId = null, onRowClick }) {
  const [orderBy, setOrderBy] = useState(defaultSortId || (columns[1]?.id ?? ''));
  const [order, setOrder] = useState('desc');

  const handleSort = (colId) => {
    if (orderBy === colId) {
      setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setOrderBy(colId);
      setOrder('desc');
    }
  };

  const sorted = [...rows].sort((a, b) => {
    const aVal = a[orderBy] ?? (typeof a[orderBy] === 'string' ? '' : -Infinity);
    const bVal = b[orderBy] ?? (typeof b[orderBy] === 'string' ? '' : -Infinity);
    if (aVal === null && bVal === null) return 0;
    if (aVal === null) return 1;
    if (bVal === null) return -1;
    if (typeof aVal === 'string') return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    return order === 'asc' ? aVal - bVal : bVal - aVal;
  });

  return (
    <Card sx={{ mb: 2 }}>
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 500 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'background.default' }}>
              {columns.map((col, colIdx) => (
                <TableCell
                  key={col.id}
                  align={col.numeric ? 'center' : 'left'}
                  sx={{
                    fontWeight: 700, fontSize: '0.72rem', py: 1.25, whiteSpace: 'nowrap',
                    width: col.width ?? 'auto',
                    ...(colIdx === 0 && { position: 'sticky', left: 0, zIndex: 3, bgcolor: 'background.default' }),
                  }}
                  sortDirection={orderBy === col.id ? order : false}
                >
                  {col.sortable !== false ? (
                    <TableSortLabel
                      active={orderBy === col.id}
                      direction={orderBy === col.id ? order : 'desc'}
                      onClick={() => handleSort(col.id)}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  통계 데이터가 없습니다
                </TableCell>
              </TableRow>
            )}
            {sorted.map((row, rowIdx) => (
              <TableRow
                key={row._rowKey ?? rowIdx}
                hover
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                sx={{ cursor: onRowClick ? 'pointer' : 'default', '&:last-child td': { borderBottom: 0 } }}
              >
                {columns.map((col, colIdx) => (
                  <TableCell
                    key={col.id}
                    align={col.numeric ? 'center' : 'left'}
                    sx={{
                      whiteSpace: 'nowrap',
                      ...(colIdx === 0 && { position: 'sticky', left: 0, zIndex: 1, bgcolor: 'background.paper' }),
                    }}
                  >
                    {colIdx === 0 ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {row._number != null && (
                          <Typography variant="caption" sx={{ fontFamily: '"Roboto Mono", monospace', color: 'text.secondary', minWidth: 24 }}>
                            #{row._number}
                          </Typography>
                        )}
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {col.format ? col.format(row[col.id]) : (row[col.id] ?? '—')}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography
                        sx={{
                          fontFamily: '"Roboto Mono", monospace',
                          fontWeight: col.highlight ? 700 : 400,
                          fontSize: '0.82rem',
                          color: col.highlight ? 'primary.main' : 'text.primary',
                        }}
                      >
                        {col.format ? col.format(row[col.id]) : fmtNum(row[col.id])}
                      </Typography>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

// ─── Column definitions ───────────────────────────────────────────────────────

const BATTING_COLUMNS = [
  { id: 'playerName', label: '선수명', numeric: false, sortable: false, width: 130 },
  { id: 'avg',               label: '타율',   numeric: true, format: fmtAvg,  highlight: true },
  { id: 'gamesPlayed',       label: '경기',   numeric: true },
  { id: 'plateAppearances',  label: '타석',   numeric: true },
  { id: 'atBats',            label: '타수',   numeric: true },
  { id: 'runs',              label: '득점',   numeric: true },
  { id: 'hits',              label: '안타',   numeric: true },
  { id: 'doubles',           label: '2루타',  numeric: true },
  { id: 'triples',           label: '3루타',  numeric: true },
  { id: 'homeRuns',          label: '홈런',   numeric: true },
  { id: 'totalBases',        label: '루타',   numeric: true },
  { id: 'rbi',               label: '타점',   numeric: true },
  { id: 'sacrificeBunts',    label: '희번',   numeric: true },
  { id: 'sacrificeFlies',    label: '희플',   numeric: true },
];

const PITCHING_COLUMNS = [
  { id: 'playerName', label: '선수명', numeric: false, sortable: false, width: 130 },
  { id: 'games',   label: '경기', numeric: true },
  { id: 'wins',    label: '승',   numeric: true },
  { id: 'losses',  label: '패',   numeric: true },
  { id: 'saves',   label: '세이브', numeric: true },
  { id: 'holds',   label: '홀드', numeric: true },
  { id: 'wpct',    label: '승률', numeric: true, format: fmtWpct },
  { id: 'ip',      label: '이닝', numeric: true },
  { id: 'h',       label: '피안타', numeric: true },
  { id: 'hr',      label: '피홈런', numeric: true },
  { id: 'bb',      label: '볼넷', numeric: true },
  { id: 'hbp',     label: '사구', numeric: true },
  { id: 'so',      label: '삼진', numeric: true },
  { id: 'r',       label: '실점', numeric: true },
  { id: 'er',      label: '자책', numeric: true },
  { id: 'era',     label: 'ERA',  numeric: true, format: fmtEra, highlight: true },
  { id: 'whip',    label: 'WHIP', numeric: true, format: fmtWhip },
];

const BASERUNNING_COLUMNS = [
  { id: 'playerName', label: '선수명', numeric: false, sortable: false, width: 130 },
  { id: 'games', label: '경기', numeric: true },
  { id: 'sba',   label: '도루시도', numeric: true },
  { id: 'sb',    label: '도루',   numeric: true, highlight: true },
  { id: 'cs',    label: '도루자', numeric: true },
  { id: 'sbPct', label: '성공률', numeric: true, format: fmtPct },
  { id: 'oob',   label: '주루사', numeric: true },
  { id: 'pko',   label: '견제사', numeric: true },
];

// ─── Main StatsPage ───────────────────────────────────────────────────────────

export default function StatsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [teamStats, setTeamStats] = useState(null);
  const [battingRows, setBattingRows] = useState([]);
  const [pitchingRows, setPitchingRows] = useState([]);
  const [baserunningRows, setBaserunningRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      getTeamStats(),
      getAllPlayerStats(),
      getPitchingStats(),
      getBaserunningStats(),
    ])
      .then(([tsRes, allStatsRes, pitchingRes, brRes]) => {
        setTeamStats(tsRes.data || tsRes);

        const allStats = allStatsRes.data || [];
        setBattingRows(
          allStats
            .filter((s) => s.gamesPlayed > 0 || s.atBats > 0)
            .map((s) => ({
              _rowKey: s.playerId,
              _number: s.number,
              _playerId: s.playerId,
              playerName: s.playerName,
              avg: s.avg ?? 0,
              gamesPlayed: s.gamesPlayed ?? 0,
              plateAppearances: s.plateAppearances ?? 0,
              atBats: s.atBats ?? 0,
              runs: s.runs ?? 0,
              hits: s.hits ?? 0,
              doubles: s.doubles ?? 0,
              triples: s.triples ?? 0,
              homeRuns: s.homeRuns ?? 0,
              totalBases: s.totalBases ?? 0,
              rbi: s.rbi ?? 0,
              sacrificeBunts: s.sacrificeBunts ?? 0,
              sacrificeFlies: s.sacrificeFlies ?? 0,
            }))
        );

        const pitching = pitchingRes.data || [];
        setPitchingRows(
          pitching
            .filter((r) => r.games > 0 || r.ip > 0)
            .map((r) => ({
              _rowKey: r.playerId,
              _number: r.number,
              playerName: r.playerName,
              games: r.games ?? 0,
              wins: r.wins ?? 0,
              losses: r.losses ?? 0,
              saves: r.saves ?? 0,
              holds: r.holds ?? 0,
              wpct: r.wpct,
              ip: r.ip ?? 0,
              h: r.h ?? 0,
              hr: r.hr ?? 0,
              bb: r.bb ?? 0,
              hbp: r.hbp ?? 0,
              so: r.so ?? 0,
              r: r.r ?? 0,
              er: r.er ?? 0,
              era: r.era ?? 0,
              whip: r.whip ?? 0,
            }))
        );

        const br = brRes.data || [];
        setBaserunningRows(
          br.map((r) => ({
            _rowKey: r.playerId,
            _number: r.number,
            playerName: r.playerName,
            games: r.games ?? 0,
            sba: r.sba ?? 0,
            sb: r.sb ?? 0,
            cs: r.cs ?? 0,
            sbPct: r.sbPct,
            oob: r.oob ?? 0,
            pko: r.pko ?? 0,
          }))
        );
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <Box sx={{ pb: 4 }}>
      {error && <Alert severity="warning" sx={{ m: 2, mb: 0 }}>{error}</Alert>}

      <Box sx={{ px: 2, pt: 2 }}>
        <TeamSummary stats={teamStats} />
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
      >
        <Tab icon={<TrendingUpIcon fontSize="small" />} iconPosition="start" label="타자" sx={{ fontWeight: 700, fontSize: '0.85rem' }} />
        <Tab icon={<SportsBaseballIcon fontSize="small" />} iconPosition="start" label="투수" sx={{ fontWeight: 700, fontSize: '0.85rem' }} />
        <Tab icon={<DirectionsRunIcon fontSize="small" />} iconPosition="start" label="주루" sx={{ fontWeight: 700, fontSize: '0.85rem' }} />
      </Tabs>

      <Box sx={{ px: 2 }}>
        {tab === 0 && (
          <>
            <SortableTable
              columns={BATTING_COLUMNS}
              rows={battingRows}
              defaultSortId="avg"
              onRowClick={(row) => row._playerId && navigate(`/players/${row._playerId}`)}
            />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              {[
                ['타율', 'AVG = H/AB'],
                ['타석', 'PA'],
                ['타수', 'AB'],
                ['득점', 'R'],
                ['안타', 'H'],
                ['2루타', '2B'],
                ['3루타', '3B'],
                ['홈런', 'HR'],
                ['루타', 'TB'],
                ['타점', 'RBI'],
                ['희번', 'SAC/SH'],
                ['희플', 'SF'],
              ].map(([kr, en]) => (
                <Box key={kr} sx={{ fontSize: '0.68rem', color: 'text.secondary', border: '1px solid', borderColor: 'divider', borderRadius: 1, px: 0.75, py: 0.25 }}>
                  <strong>{kr}</strong> {en}
                </Box>
              ))}
            </Box>
          </>
        )}

        {tab === 1 && (
          <>
            <SortableTable
              columns={PITCHING_COLUMNS}
              rows={pitchingRows}
              defaultSortId="era"
            />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              {[
                ['경기', 'G'],
                ['승', 'W'],
                ['패', 'L'],
                ['세이브', 'SV'],
                ['홀드', 'HLD'],
                ['승률', 'WPCT=W/(W+L)'],
                ['이닝', 'IP'],
                ['피안타', 'H'],
                ['피홈런', 'HR'],
                ['볼넷', 'BB'],
                ['사구', 'HBP'],
                ['삼진', 'SO'],
                ['실점', 'R'],
                ['자책', 'ER'],
                ['ERA', 'ER/IP×9'],
                ['WHIP', '(BB+H)/IP'],
              ].map(([kr, en]) => (
                <Box key={kr} sx={{ fontSize: '0.68rem', color: 'text.secondary', border: '1px solid', borderColor: 'divider', borderRadius: 1, px: 0.75, py: 0.25 }}>
                  <strong>{kr}</strong> {en}
                </Box>
              ))}
            </Box>
          </>
        )}

        {tab === 2 && (
          <>
            <SortableTable
              columns={BASERUNNING_COLUMNS}
              rows={baserunningRows}
              defaultSortId="sb"
            />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              {[
                ['경기', 'G'],
                ['도루시도', 'SBA=SB+CS'],
                ['도루', 'SB'],
                ['도루자', 'CS'],
                ['성공률', 'SB%=SB/SBA'],
                ['주루사', 'OOB'],
                ['견제사', 'PKO'],
              ].map(([kr, en]) => (
                <Box key={kr} sx={{ fontSize: '0.68rem', color: 'text.secondary', border: '1px solid', borderColor: 'divider', borderRadius: 1, px: 0.75, py: 0.25 }}>
                  <strong>{kr}</strong> {en}
                </Box>
              ))}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
