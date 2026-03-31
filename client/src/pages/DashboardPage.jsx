import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import SportsBaseballIcon from '@mui/icons-material/SportsBaseball';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

import { getDashboard, getLeagues } from '../api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ScoreChip from '../components/ScoreChip.jsx';
import { formatAvg } from '../utils/statsCalculator.js';

function RecordCard({ record }) {
  const { wins = 0, losses = 0, draws = 0, winPct = 0 } = record || {};
  return (
    <Card sx={{ bgcolor: '#0d1b3e', color: '#fff' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
          2026 시즌 성적
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 1, mb: 1 }}>
          <Typography sx={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: '"Roboto Mono", monospace', lineHeight: 1 }}>
            {wins}
          </Typography>
          <Typography sx={{ fontSize: '1.2rem', opacity: 0.7 }}>승</Typography>
          <Typography sx={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: '"Roboto Mono", monospace', lineHeight: 1 }}>
            {losses}
          </Typography>
          <Typography sx={{ fontSize: '1.2rem', opacity: 0.7 }}>패</Typography>
          <Typography sx={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: '"Roboto Mono", monospace', lineHeight: 1 }}>
            {draws}
          </Typography>
          <Typography sx={{ fontSize: '1.2rem', opacity: 0.7 }}>무</Typography>
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.75 }}>
          승률 {(winPct * 100).toFixed(1)}%
        </Typography>
      </CardContent>
    </Card>
  );
}

function TeamStatsCard({ stats }) {
  if (!stats) return null;
  const items = [
    { label: '팀타율', value: formatAvg(stats.avg) },
    { label: '팀출루율', value: formatAvg(stats.obp) },
    { label: '팀장타율', value: formatAvg(stats.slg) },
  ];
  return (
    <Card>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <TrendingUpIcon color="primary" fontSize="small" />
          <Typography variant="subtitle2" color="primary">팀 타격 통계</Typography>
        </Box>
        <Grid container spacing={1}>
          {items.map((item) => (
            <Grid item xs={4} key={item.label}>
              <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'background.default', borderRadius: 2 }}>
                <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 700, fontSize: '1.2rem', color: 'primary.main' }}>
                  {item.value}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
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

function RecentGamesCard({ games, leagueMap, onGameClick }) {
  if (!games?.length) return (
    <Card>
      <CardContent>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          최근 경기 기록이 없습니다
        </Typography>
      </CardContent>
    </Card>
  );
  return (
    <Card>
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SportsBaseballIcon color="primary" fontSize="small" />
          <Typography variant="subtitle2" color="primary">최근 경기</Typography>
        </Box>
        <Divider />
        <List dense disablePadding>
          {games.map((game, idx) => (
            <React.Fragment key={game.id}>
              <ListItem
                sx={{ py: 1.25, px: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                onClick={() => onGameClick(game.id)}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>vs {game.opponent}</Typography>
                      {game.leagueId && leagueMap[game.leagueId] && (
                        <Chip label={leagueMap[game.leagueId]} size="small" variant="outlined" color="primary" sx={{ height: 18, fontSize: '0.6rem' }} />
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {game.date} &nbsp;·&nbsp; {game.scoreOurs ?? '-'} : {game.scoreTheirs ?? '-'}
                    </Typography>
                  }
                />
                <ListItemSecondaryAction>
                  <ScoreChip result={game.result} />
                </ListItemSecondaryAction>
              </ListItem>
              {idx < games.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

function LeaderCard({ leaders }) {
  if (!leaders?.avg?.length) return null;
  return (
    <Card>
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmojiEventsIcon sx={{ color: '#b45309' }} fontSize="small" />
          <Typography variant="subtitle2" sx={{ color: '#b45309', fontWeight: 700 }}>타율 리더보드</Typography>
        </Box>
        <Divider />
        <List dense disablePadding>
          {(leaders.avg || []).slice(0, 3).map((entry, idx) => (
            <React.Fragment key={entry.playerId}>
              <ListItem sx={{ py: 1, px: 2 }}>
                <Avatar
                  sx={{
                    width: 28, height: 28, mr: 1.5, fontSize: '0.75rem', fontWeight: 700,
                    bgcolor: idx === 0 ? '#b45309' : idx === 1 ? '#475569' : '#78350f',
                  }}
                >
                  {idx + 1}
                </Avatar>
                <ListItemText
                  primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>{entry.name}</Typography>}
                />
                <Typography
                  sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 700, color: 'primary.main', fontSize: '1rem' }}
                >
                  {formatAvg(entry.value)}
                </Typography>
              </ListItem>
              {idx < 2 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

function InProgressGamesCard({ games, leagueMap, onGameClick }) {
  if (!games?.length) return null;
  return (
    <Card sx={{ border: '2px solid', borderColor: 'error.main' }}>
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SportsBaseballIcon color="error" fontSize="small" />
          <Typography variant="subtitle2" color="error" sx={{ fontWeight: 700 }}>진행중인 경기</Typography>
          <Chip label="LIVE" size="small" color="error" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }} />
        </Box>
        <Divider />
        <List dense disablePadding>
          {games.map((game, idx) => (
            <React.Fragment key={game.id}>
              <ListItem
                sx={{ py: 1.25, px: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                onClick={() => onGameClick(game.id)}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>vs {game.opponent}</Typography>
                      {game.leagueId && leagueMap[game.leagueId] && (
                        <Chip label={leagueMap[game.leagueId]} size="small" variant="outlined" color="primary" sx={{ height: 18, fontSize: '0.6rem' }} />
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {game.date}{game.venue ? ` · ${game.venue}` : ''}
                    </Typography>
                  }
                />
              </ListItem>
              {idx < games.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

function TournamentProgressCard({ tournaments }) {
  if (!tournaments?.length) return null;
  return (
    <Card sx={{ border: '2px solid', borderColor: 'warning.main' }}>
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmojiEventsIcon sx={{ color: '#b45309' }} fontSize="small" />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#b45309' }}>전국대회 진행 현황</Typography>
        </Box>
        <Divider />
        <List dense disablePadding>
          {tournaments.map((t, idx) => (
            <React.Fragment key={t.leagueId}>
              <ListItem sx={{ py: 1.25, px: 2, flexDirection: 'column', alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{t.leagueName}</Typography>
                  <Chip label={t.season} size="small" color="primary" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }} />
                </Box>
                {t.playedRounds.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.5 }}>
                    {t.playedRounds.map((r) => (
                      <Chip key={r} label={r} size="small" variant="outlined" color="success" sx={{ height: 18, fontSize: '0.6rem' }} />
                    ))}
                  </Box>
                )}
                {t.nextGame && (
                  <Typography variant="caption" color="text.secondary">
                    다음: {t.nextGame.round ? `${t.nextGame.round} · ` : ''}{t.nextGame.date} vs {t.nextGame.opponent}
                  </Typography>
                )}
              </ListItem>
              {idx < tournaments.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

function UpcomingGamesCard({ games, leagueMap, onGameClick }) {
  if (!games?.length) return null;
  return (
    <Card sx={{ border: '2px solid', borderColor: 'secondary.main' }}>
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarTodayIcon color="secondary" fontSize="small" />
          <Typography variant="subtitle2" color="secondary" sx={{ fontWeight: 700 }}>예정 경기</Typography>
          <Chip label={games.length} size="small" color="secondary" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }} />
        </Box>
        <Divider />
        <List dense disablePadding>
          {games.map((game, idx) => (
            <React.Fragment key={game.id}>
              <ListItem
                sx={{ py: 1.25, px: 2, cursor: onGameClick ? 'pointer' : 'default', '&:hover': onGameClick ? { bgcolor: 'action.hover' } : {} }}
                onClick={() => onGameClick && onGameClick(game.id)}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>vs {game.opponent}</Typography>
                      {game.leagueId && leagueMap[game.leagueId] && (
                        <Chip label={leagueMap[game.leagueId]} size="small" variant="outlined" color="primary" sx={{ height: 18, fontSize: '0.6rem' }} />
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {game.date}{game.venue ? ` · ${game.venue}` : ''}
                    </Typography>
                  }
                />
              </ListItem>
              {idx < games.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [leagueMap, setLeagueMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([getDashboard(), getLeagues()])
      .then(([dashRes, leaguesRes]) => {
        setData(dashRes.data || dashRes);
        const map = Object.fromEntries((leaguesRes.data || []).map((l) => [l.id, l.name]));
        setLeagueMap(map);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <Box sx={{ p: 2, pb: 1 }}>
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          데이터를 불러오지 못했습니다: {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <RecordCard record={data?.teamRecord} />

        <TournamentProgressCard tournaments={data?.activeTournaments} />

        <UpcomingGamesCard
          games={(data?.upcomingGames || []).slice(0, 2)}
          leagueMap={leagueMap}
          onGameClick={(id) => navigate(`/games/${id}`)}
        />

        <RecentGamesCard
          games={data?.recentGames}
          leagueMap={leagueMap}
          onGameClick={(id) => navigate(`/games/${id}`)}
        />

        <TeamStatsCard stats={data?.teamStats} />

        <LeaderCard leaders={data?.leaders} />
      </Box>
    </Box>
  );
}
