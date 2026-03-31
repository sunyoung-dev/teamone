import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Fab from '@mui/material/Fab';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import AddIcon from '@mui/icons-material/Add';
import SportsBaseballIcon from '@mui/icons-material/SportsBaseball';

import { getGames, getLeagues } from '../api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ScoreChip from '../components/ScoreChip.jsx';

function GameCard({ game, leagueName, onClick }) {
  const today = new Date().toISOString().slice(0, 10);
  const isInProgress = game.status === 'in_progress';
  const isLive = isInProgress && game.date === today;
  const isUpcoming = (isInProgress && game.date !== today) || (game.status === 'scheduled' && (game.date || '') >= today);
  return (
    <Card
      sx={{
        mb: 1.5,
        border: (isLive || isUpcoming) ? '2px solid' : 'none',
        borderColor: isLive ? 'secondary.main' : 'warning.main',
      }}
    >
      <CardActionArea onClick={onClick}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                vs {game.opponent}
              </Typography>
              {isLive && (
                <Chip label="진행중" size="small" color="secondary" sx={{ height: 20, fontSize: '0.65rem' }} />
              )}
              {isUpcoming && (
                <Chip label="진행예정" size="small" color="warning" sx={{ height: 20, fontSize: '0.65rem' }} />
              )}
              {leagueName && (
                <Chip label={leagueName} size="small" variant="outlined" color="primary" sx={{ height: 20, fontSize: '0.65rem' }} />
              )}
            </Box>
            <ScoreChip result={game.result} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {game.date}
            </Typography>
            {game.status === 'final' && (
              <Typography variant="body2" sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 700, color: 'text.primary' }}>
                {game.scoreOurs} : {game.scoreTheirs}
              </Typography>
            )}
            {game.venue && (
              <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto', fontSize: '0.75rem' }}>
                📍 {game.venue}
              </Typography>
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default function GamesPage() {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [leagueFilter, setLeagueFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([getGames(), getLeagues()])
      .then(([gamesRes, leaguesRes]) => {
        const list = gamesRes.data || [];
        list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        setGames(list);
        setLeagues(leaguesRes.data || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const leagueMap = Object.fromEntries(leagues.map((l) => [l.id, l.name]));
  const filtered = leagueFilter ? games.filter((g) => g.leagueId === leagueFilter) : games;

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* League filter chips */}
      {leagues.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip
            label="전체"
            onClick={() => setLeagueFilter('')}
            color={leagueFilter === '' ? 'primary' : 'default'}
            variant={leagueFilter === '' ? 'filled' : 'outlined'}
            size="small"
            sx={{ fontWeight: 600 }}
          />
          {leagues.map((l) => (
            <Chip
              key={l.id}
              label={l.name}
              onClick={() => setLeagueFilter(leagueFilter === l.id ? '' : l.id)}
              color={leagueFilter === l.id ? 'primary' : 'default'}
              variant={leagueFilter === l.id ? 'filled' : 'outlined'}
              size="small"
              sx={{ fontWeight: 600 }}
            />
          ))}
        </Box>
      )}

      {filtered.length === 0 && !error && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <SportsBaseballIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            {leagueFilter ? '해당 리그 경기가 없습니다' : '등록된 경기가 없습니다'}
          </Typography>
          {!leagueFilter && (
            <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
              + 버튼으로 새 경기를 등록하세요
            </Typography>
          )}
        </Box>
      )}

      {filtered.map((game) => (
        <GameCard
          key={game.id}
          game={game}
          leagueName={game.leagueId ? leagueMap[game.leagueId] : null}
          onClick={() => navigate(`/games/${game.id}`)}
        />
      ))}

      <Fab
        color="secondary"
        aria-label="새 경기 등록"
        onClick={() => navigate('/games/new')}
        sx={{ position: 'fixed', bottom: 80, right: 16 }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}
