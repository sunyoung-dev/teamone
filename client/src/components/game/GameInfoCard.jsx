import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import ScoreChip from '../ScoreChip.jsx';

export default function GameInfoCard({ game, ourScore, leagueName }) {
  const today = new Date().toISOString().slice(0, 10);
  const isFinal = game.status === 'final';
  const isInProgress = game.status === 'in_progress';
  const isLive = isInProgress && game.date === today;
  const isUpcoming = isInProgress && game.date !== today;
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>vs {game.opponent}</Typography>
            {leagueName && (
              <Chip label={leagueName} size="small" variant="outlined" color="primary" sx={{ height: 20, fontSize: '0.65rem' }} />
            )}
            {game.round && (
              <Chip label={game.round} size="small" color="warning" sx={{ height: 20, fontSize: '0.65rem' }} />
            )}
          </Box>
          <ScoreChip result={game.result} size="medium" />
        </Box>
        <Box sx={{ display: 'flex', gap: 3, mb: 0.5 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">날짜</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{game.date}</Typography>
          </Box>
          {game.venue && (
            <Box>
              <Typography variant="caption" color="text.secondary">장소</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{game.venue}</Typography>
            </Box>
          )}
          {(isFinal || isLive) && (
            <Box>
              <Typography variant="caption" color="text.secondary">스코어</Typography>
              <Typography variant="body2" sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 700 }}>
                {isFinal ? game.scoreOurs : ourScore} : {isFinal ? game.scoreTheirs : '?'}
              </Typography>
            </Box>
          )}
        </Box>
        <Chip
          label={isFinal ? '종료' : isLive ? '진행중' : isUpcoming ? '진행예정' : '예정'}
          size="small"
          color={isLive ? 'secondary' : isUpcoming ? 'warning' : 'default'}
          sx={{ mt: 0.5 }}
        />
      </CardContent>
    </Card>
  );
}
