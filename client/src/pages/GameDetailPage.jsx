import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import EditIcon from '@mui/icons-material/Edit';

import {
  getGame, getPlayers, updateGame,
  getOpponentAtBats,
  getPitching,
  getSubstitutions, addSubstitution, deleteSubstitution,
  getLeagues,
} from '../api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import GameInfoCard from '../components/game/GameInfoCard.jsx';
import LineupTab from '../components/game/LineupTab.jsx';
import AtBatsTab from '../components/game/AtBatsTab.jsx';
import OpponentTab from '../components/game/OpponentTab.jsx';
import PitchingTab from '../components/game/PitchingTab.jsx';

export default function GameDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [game, setGame] = useState(null);
  const [atBats, setAtBats] = useState([]);
  const [players, setPlayers] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [opponentAtBats, setOpponentAtBats] = useState([]);
  const [pitchingRecords, setPitchingRecords] = useState([]);
  const [substitutions, setSubstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [endGameOpen, setEndGameOpen] = useState(false);
  const [theirScore, setTheirScore] = useState('');
  const [endingSaving, setEndingSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      getGame(id),
      getPlayers(),
      getLeagues().catch(() => ({ data: [] })),
      getOpponentAtBats(id).catch(() => ({ atBats: [] })),
      getPitching(id).catch(() => ({ records: [] })),
      getSubstitutions(id).catch(() => ({ data: [] })),
    ])
      .then(([gameRes, playersRes, leaguesRes, oppAtBatsRes, pitchingRes, subsRes]) => {
        const g = gameRes.data || gameRes;
        setGame(g);
        setLeagues(leaguesRes.data || []);
        setAtBats(g.atBats || []);
        setPlayers(playersRes.data || []);
        setOpponentAtBats(
          oppAtBatsRes.atBats || oppAtBatsRes.data || (Array.isArray(oppAtBatsRes) ? oppAtBatsRes : [])
        );
        setPitchingRecords(
          pitchingRes.records || pitchingRes.data || (Array.isArray(pitchingRes) ? pitchingRes : [])
        );
        setSubstitutions(
          subsRes.data || subsRes.substitutions || (Array.isArray(subsRes) ? subsRes : [])
        );
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const ourScore = atBats.reduce((sum, ab) => sum + (ab.run || 0), 0);

  const handleEndGame = async () => {
    const scoreTheirs = Number(theirScore) || 0;
    const result = ourScore > scoreTheirs ? 'W' : ourScore < scoreTheirs ? 'L' : 'D';
    setEndingSaving(true);
    try {
      const res = await updateGame(id, { status: 'final', scoreOurs: ourScore, scoreTheirs, result });
      setGame(res.data || res);
      setEndGameOpen(false);
      setTheirScore('');
    } catch (e) {
      console.error(e);
    }
    setEndingSaving(false);
  };

  const handleSubstitutionAdded = async (data) => {
    try {
      const res = await addSubstitution(id, data);
      const newSub = res.substitution || res.data || { ...data, id: Date.now().toString() };
      setSubstitutions((prev) => [...prev, newSub]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubstitutionDeleted = async (subId) => {
    try {
      await deleteSubstitution(id, subId);
      setSubstitutions((prev) => prev.filter((s) => s.id !== subId));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  if (!game) return null;

  const leagueName = game.leagueId ? (leagues.find((l) => l.id === game.leagueId)?.name) : null;

  return (
    <Box sx={{ pb: 10 }}>
      <Box sx={{ p: 2, pb: 0 }}>
        <GameInfoCard game={game} ourScore={ourScore} leagueName={leagueName} />
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <Button size="small" startIcon={<EditIcon />} onClick={() => navigate(`/games/${id}/edit`)}>
            경기 정보 수정
          </Button>
          {game.status !== 'final' && (
            <Button size="small" variant="contained" color="secondary" onClick={() => setEndGameOpen(true)}>
              경기 종료
            </Button>
          )}
        </Box>
      </Box>

      <Dialog open={endGameOpen} onClose={() => setEndGameOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { mx: 2, borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>경기 종료</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="caption" color="text.secondary">우리팀 (자동 계산)</Typography>
              <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 800, fontSize: '2rem', color: 'primary.main' }}>
                {ourScore}
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.secondary' }}>:</Typography>
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="caption" color="text.secondary">{game.opponent}</Typography>
              <TextField
                type="number"
                value={theirScore}
                onChange={(e) => setTheirScore(e.target.value)}
                inputProps={{ min: 0, style: { textAlign: 'center', fontSize: '2rem', fontWeight: 800, fontFamily: 'Roboto Mono, monospace', padding: '4px 8px' } }}
                sx={{ mt: 0.5 }}
                placeholder="0"
                autoFocus
              />
            </Box>
          </Box>
          {theirScore !== '' && (
            <Chip
              label={ourScore > Number(theirScore) ? '승리 🎉' : ourScore < Number(theirScore) ? '패배' : '무승부'}
              color={ourScore > Number(theirScore) ? 'success' : ourScore < Number(theirScore) ? 'error' : 'default'}
              sx={{ width: '100%', fontWeight: 700, fontSize: '1rem', height: 40 }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
          <Button onClick={() => setEndGameOpen(false)} variant="outlined" sx={{ flex: 1 }}>취소</Button>
          <Button onClick={handleEndGame} variant="contained" disabled={theirScore === '' || endingSaving} sx={{ flex: 2 }}>
            {endingSaving ? '저장 중...' : '경기 종료 확정'}
          </Button>
        </DialogActions>
      </Dialog>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="라인업" />
        <Tab label="타석 기록" />
        <Tab label="상대팀 기록" />
        <Tab label="투수 기록" />
      </Tabs>

      {tab === 0 && (
        <Box sx={{ pt: 2 }}>
          <LineupTab
            lineup={game.lineup}
            players={players}
            game={game}
            substitutions={substitutions}
            onSubstitutionAdded={handleSubstitutionAdded}
            onSubstitutionDeleted={handleSubstitutionDeleted}
          />
          <Box sx={{ px: 2, mt: 2 }}>
            <Button variant="outlined" fullWidth onClick={() => navigate(`/games/${id}/edit`)}>
              라인업 수정
            </Button>
          </Box>
        </Box>
      )}

      {tab === 1 && (
        <AtBatsTab
          gameId={id}
          game={game}
          players={players}
          atBats={atBats}
          substitutions={substitutions}
          onAtBatAdded={(ab) => setAtBats((prev) => [...prev, ab])}
          onAtBatDeleted={(abId) => setAtBats((prev) => prev.filter((ab) => ab.id !== abId))}
        />
      )}

      {tab === 2 && (
        <OpponentTab
          gameId={id}
          game={game}
          players={players}
          opponentAtBats={opponentAtBats}
          substitutions={substitutions}
          onOpponentAtBatAdded={(ab) => setOpponentAtBats((prev) => [...prev, ab])}
          onOpponentAtBatDeleted={(abId) => setOpponentAtBats((prev) => prev.filter((ab) => ab.id !== abId))}
        />
      )}

      {tab === 3 && (
        <PitchingTab
          gameId={id}
          game={game}
          players={players}
          pitchingRecords={pitchingRecords}
          opponentAtBats={opponentAtBats}
          onPitchingAdded={(rec) => setPitchingRecords((prev) => [...prev, rec])}
          onPitchingDeleted={(recId) => setPitchingRecords((prev) => prev.filter((r) => r.id !== recId))}
        />
      )}
    </Box>
  );
}
