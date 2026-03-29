import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import EditIcon from '@mui/icons-material/Edit';

import { getPlayer, getPlayerStats } from '../api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { POSITION_MAP, BATTING_HAND_MAP } from '../utils/constants.js';
import { formatAvg, formatOps } from '../utils/statsCalculator.js';

function StatItem({ label, value, highlight }) {
  return (
    <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: highlight ? 'primary.main' : 'background.default', borderRadius: 2 }}>
      <Typography
        sx={{
          fontFamily: '"Roboto Mono", monospace',
          fontWeight: 800,
          fontSize: highlight ? '1.5rem' : '1.1rem',
          color: highlight ? '#fff' : 'primary.main',
          lineHeight: 1,
        }}
      >
        {value}
      </Typography>
      <Typography variant="caption" sx={{ color: highlight ? 'rgba(255,255,255,0.8)' : 'text.secondary', fontWeight: 600, mt: 0.25, display: 'block' }}>
        {label}
      </Typography>
    </Box>
  );
}

export default function PlayerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([getPlayer(id), getPlayerStats(id)])
      .then(([playerRes, statsRes]) => {
        setPlayer(playerRes.data || playerRes);
        setStats(statsRes.data || statsRes);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  if (!player) return null;

  return (
    <Box sx={{ p: 2, pb: 4 }}>
      {/* Player info card */}
      <Card sx={{ mb: 2, background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)', color: '#fff' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{ width: 64, height: 64, bgcolor: 'rgba(255,255,255,0.2)', fontSize: '1.5rem', fontWeight: 800, fontFamily: '"Roboto Mono", monospace', border: '2px solid rgba(255,255,255,0.5)' }}
            >
              {player.number}
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.1 }}>{player.name}</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.75, flexWrap: 'wrap' }}>
                <Chip label={POSITION_MAP[player.position] || player.position} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700 }} />
                <Chip label={BATTING_HAND_MAP[player.battingHand] || player.battingHand} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff' }} />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Button
        startIcon={<EditIcon />}
        onClick={() => navigate(`/players/${id}/edit`)}
        sx={{ mb: 2 }}
        size="small"
      >
        선수 정보 수정
      </Button>

      {/* Season stats */}
      {stats && (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>시즌 통계</Typography>
            <Grid container spacing={1} sx={{ mb: 1 }}>
              <Grid item xs={3}><StatItem label="타율" value={formatAvg(stats.avg)} highlight /></Grid>
              <Grid item xs={3}><StatItem label="출루율" value={formatAvg(stats.obp)} /></Grid>
              <Grid item xs={3}><StatItem label="장타율" value={formatAvg(stats.slg)} /></Grid>
              <Grid item xs={3}><StatItem label="OPS" value={formatOps(stats.ops)} /></Grid>
            </Grid>
            <Divider sx={{ my: 1.5 }} />
            <Grid container spacing={1}>
              {[
                { label: '타석', value: stats.plateAppearances ?? stats.pa ?? 0 },
                { label: '타수', value: stats.atBats ?? stats.ab ?? 0 },
                { label: '안타', value: stats.hits ?? stats.h ?? 0 },
                { label: '2루타', value: stats.doubles ?? 0 },
                { label: '3루타', value: stats.triples ?? 0 },
                { label: '홈런', value: stats.homeRuns ?? stats.hr ?? 0 },
                { label: '볼넷', value: stats.walks ?? stats.bb ?? 0 },
                { label: '삼진', value: stats.strikeouts ?? stats.so ?? 0 },
                { label: '경기', value: stats.gamesPlayed ?? stats.games ?? 0 },
              ].map((item) => (
                <Grid item xs={4} key={item.label}>
                  <Box sx={{ textAlign: 'center', py: 0.75 }}>
                    <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 700, fontSize: '1rem', color: 'text.primary' }}>
                      {item.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{item.label}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
