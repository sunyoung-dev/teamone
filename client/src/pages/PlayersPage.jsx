import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Fab from '@mui/material/Fab';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import AddIcon from '@mui/icons-material/Add';
import PeopleIcon from '@mui/icons-material/People';

import { getPlayers } from '../api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { POSITION_MAP } from '../utils/constants.js';

function PlayerCard({ player, onClick }) {
  return (
    <Card>
      <CardActionArea onClick={onClick}>
        <CardContent sx={{ p: 2, textAlign: 'center' }}>
          <Avatar
            sx={{
              width: 52, height: 52, mx: 'auto', mb: 1,
              bgcolor: 'primary.main',
              fontSize: '1.1rem',
              fontWeight: 800,
              fontFamily: '"Roboto Mono", monospace',
            }}
          >
            {player.number}
          </Avatar>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.25 }}>
            {player.name}
          </Typography>
          <Chip
            label={POSITION_MAP[player.position] || player.position}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontSize: '0.7rem', height: 20 }}
          />
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default function PlayersPage() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getPlayers()
      .then((res) => {
        const list = (res.data || []).filter((p) => p.active !== false);
        list.sort((a, b) => (a.number ?? 99) - (b.number ?? 99));
        setPlayers(list);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {players.length === 0 && !error && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <PeopleIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            등록된 선수가 없습니다
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
            + 버튼으로 선수를 등록하세요
          </Typography>
        </Box>
      )}

      <Grid container spacing={1.5}>
        {players.map((player) => (
          <Grid item xs={4} sm={3} md={2} key={player.id}>
            <PlayerCard
              player={player}
              onClick={() => navigate(`/players/${player.id}`)}
            />
          </Grid>
        ))}
      </Grid>

      <Fab
        color="secondary"
        aria-label="선수 등록"
        onClick={() => navigate('/players/new')}
        sx={{ position: 'fixed', bottom: 80, right: 16 }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}
