import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { POSITION_MAP } from '../../utils/constants.js';
import SubstitutionDialog from './SubstitutionDialog.jsx';

export default function LineupTab({ lineup, players, game, substitutions, onSubstitutionAdded, onSubstitutionDeleted }) {
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const playerMap = Object.fromEntries((players || []).map((p) => [p.id, p]));
  const sorted = [...(lineup || [])].sort((a, b) => a.battingOrder - b.battingOrder);
  const sortedSubs = [...(substitutions || [])].sort((a, b) => a.inning - b.inning);

  const getSubLabel = (sub) => {
    if (sub.isOpponent) {
      return `${sub.inning}회 | ${sub.battingOrder}번 타순 | ${sub.outPlayerName} → ${sub.inPlayerName}${sub.position ? ` (${POSITION_MAP[sub.position] || sub.position})` : ''}`;
    }
    const outPlayer = playerMap[sub.outPlayerId];
    const inPlayer = playerMap[sub.inPlayerId];
    return `${sub.inning}회 | ${sub.battingOrder}번 타순 | ${outPlayer?.name ?? sub.outPlayerId} → ${inPlayer?.name ?? sub.inPlayerId}${sub.position ? ` (${POSITION_MAP[sub.position] || sub.position})` : ''}`;
  };

  return (
    <Box>
      {sorted.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="body2" color="text.secondary">라인업이 없습니다</Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: 40 }}>타순</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>선수</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>포지션</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.map((entry) => {
                const player = playerMap[entry.playerId];
                return (
                  <TableRow key={entry.playerId} hover>
                    <TableCell>
                      <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 700, color: 'primary.main' }}>
                        {entry.battingOrder}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Typography variant="caption" sx={{ fontFamily: '"Roboto Mono", monospace', color: 'text.secondary', minWidth: 20 }}>
                          #{player?.number ?? '?'}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{player?.name ?? entry.playerId}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={POSITION_MAP[entry.position] || entry.position} size="small" variant="outlined" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Divider sx={{ my: 2 }} />

      <Box sx={{ px: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>선수 교체 기록</Typography>
          <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => setSubDialogOpen(true)}>
            교체 추가
          </Button>
        </Box>

        {sortedSubs.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
            교체 기록이 없습니다
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {sortedSubs.map((sub) => (
              <Box
                key={sub.id}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1,
                  px: 1.5, py: 1, borderRadius: 1.5,
                  border: '1px solid', borderColor: 'divider',
                  bgcolor: 'background.paper',
                }}
              >
                <Chip
                  label={`${sub.inning}회`}
                  size="small"
                  color={sub.isOpponent ? 'secondary' : 'primary'}
                  sx={{ fontWeight: 700, minWidth: 36, flexShrink: 0 }}
                />
                <Typography variant="body2" sx={{ flex: 1, fontSize: '0.8rem' }}>
                  {getSubLabel(sub)}
                </Typography>
                <IconButton size="small" color="error" onClick={() => onSubstitutionDeleted(sub.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <SubstitutionDialog
        open={subDialogOpen}
        onClose={() => setSubDialogOpen(false)}
        onConfirm={onSubstitutionAdded}
        game={game}
        players={players}
        substitutions={substitutions}
      />
    </Box>
  );
}
