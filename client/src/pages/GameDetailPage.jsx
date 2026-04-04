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
import IconButton from '@mui/material/IconButton';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import EditIcon from '@mui/icons-material/Edit';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import DeleteIcon from '@mui/icons-material/Delete';

import {
  getGame, getPlayers, updateGame,
  getOpponentAtBats,
  getPitching,
  getSubstitutions, addSubstitution, deleteSubstitution,
  getLeagues,
  addHighlight, deleteHighlight,
} from '../api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import GameInfoCard from '../components/game/GameInfoCard.jsx';
import LineupTab from '../components/game/LineupTab.jsx';
import AtBatsTab from '../components/game/AtBatsTab.jsx';
import OpponentTab from '../components/game/OpponentTab.jsx';
import PitchingTab from '../components/game/PitchingTab.jsx';
import ScoreCardGrid from '../components/scorecard/ScoreCardGrid.jsx';

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
  const [highlights, setHighlights] = useState([]);
  const [highlightInput, setHighlightInput] = useState('');
  const [highlightSaving, setHighlightSaving] = useState(false);
  const [endGameOpen, setEndGameOpen] = useState(false);
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
        setHighlights(g.highlights || []);
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
  const theirScore = opponentAtBats.reduce((sum, ab) => sum + (ab.run || 0), 0);

  const handleEndGame = async () => {
    const result = ourScore > theirScore ? 'W' : ourScore < theirScore ? 'L' : 'D';
    setEndingSaving(true);
    try {
      const res = await updateGame(id, { status: 'final', scoreOurs: ourScore, scoreTheirs: theirScore, result });
      setGame(res.data || res);
      setEndGameOpen(false);
    } catch (e) {
      console.error(e);
    }
    setEndingSaving(false);
  };

  const handleHighlightAdd = async () => {
    const text = highlightInput.trim();
    if (!text) return;
    setHighlightSaving(true);
    try {
      const res = await addHighlight(id, text);
      setHighlights(prev => [...prev, res.data]);
      setHighlightInput('');
    } catch (e) {
      console.error(e);
    } finally {
      setHighlightSaving(false);
    }
  };

  const handleHighlightDelete = async (highlightId) => {
    try {
      await deleteHighlight(id, highlightId);
      setHighlights(prev => prev.filter(h => h.id !== highlightId));
    } catch (e) {
      console.error(e);
    }
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
        <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
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
              <Typography variant="caption" color="text.secondary">우리팀</Typography>
              <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 800, fontSize: '2rem', color: 'primary.main' }}>
                {ourScore}
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.secondary' }}>:</Typography>
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="caption" color="text.secondary">{game.opponent}</Typography>
              <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 800, fontSize: '2rem', color: 'error.main' }}>
                {theirScore}
              </Typography>
            </Box>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mb: 1.5 }}>
            타석 기록의 득점 합산으로 자동 계산됩니다
          </Typography>
          <Chip
            label={ourScore > theirScore ? '승리 🎉' : ourScore < theirScore ? '패배' : '무승부'}
            color={ourScore > theirScore ? 'success' : ourScore < theirScore ? 'error' : 'default'}
            sx={{ width: '100%', fontWeight: 700, fontSize: '1rem', height: 40 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
          <Button onClick={() => setEndGameOpen(false)} variant="outlined" sx={{ flex: 1 }}>취소</Button>
          <Button onClick={handleEndGame} variant="contained" disabled={endingSaving} sx={{ flex: 2 }}>
            {endingSaving ? '저장 중...' : '경기 종료 확정'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 특별 기록 (하이라이트) */}
      <Box sx={{ px: 2, pb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
          <EmojiEventsIcon sx={{ fontSize: 16, color: 'warning.main' }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>특별 기록</Typography>
        </Box>
        {highlights.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1 }}>
            {highlights.map((h) => (
              <Box key={h.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, bgcolor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 1.5, px: 1.25, py: 0.6 }}>
                <Typography sx={{ fontSize: '0.8rem', flex: 1, color: '#78350f', lineHeight: 1.4 }}>
                  ⭐ {h.text}
                </Typography>
                <Typography variant="caption" sx={{ color: '#a16207', flexShrink: 0, fontSize: '0.65rem' }}>{h.createdAt}</Typography>
                <IconButton size="small" onClick={() => handleHighlightDelete(h.id)} sx={{ p: 0.25, color: '#a16207' }}>
                  <DeleteIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="예: 전난주 첫 안타, 첫 승리투수"
            value={highlightInput}
            onChange={(e) => setHighlightInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleHighlightAdd()}
            inputProps={{ maxLength: 80 }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
          />
          <Button
            variant="contained"
            size="small"
            onClick={handleHighlightAdd}
            disabled={highlightSaving || !highlightInput.trim()}
            sx={{ flexShrink: 0, minWidth: 48, bgcolor: 'warning.main', '&:hover': { bgcolor: 'warning.dark' } }}
          >
            추가
          </Button>
        </Box>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ px: 1, borderBottom: 1, borderColor: 'divider' }}
        variant="scrollable"
        scrollButtons={false}
      >
        <Tab label="라인업" sx={{ fontSize: '0.78rem', minWidth: 0, px: 1.5 }} />
        <Tab label="타석 기록" sx={{ fontSize: '0.78rem', minWidth: 0, px: 1.5 }} />
        <Tab label="스코어카드" sx={{ fontSize: '0.78rem', minWidth: 0, px: 1.5 }} />
        <Tab label="투수 기록" sx={{ fontSize: '0.78rem', minWidth: 0, px: 1.5 }} />
        <Tab label="상대팀" sx={{ fontSize: '0.78rem', minWidth: 0, px: 1.5 }} />
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
          onAtBatUpdated={(ab) => setAtBats((prev) => prev.map((a) => a.id === ab.id ? ab : a))}
        />
      )}

      {tab === 2 && (
        <Box>
          <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
            <Typography variant="caption" color="text.disabled">
              셀을 탭하면 상세 정보가 표시됩니다 · 수비수: 포지션 번호
            </Typography>
          </Box>
          <ScoreCardGrid
            atBats={atBats}
            players={players}
            lineup={game.lineup}
            maxInning={game.innings || 9}
          />
        </Box>
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

      {tab === 4 && (
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
    </Box>
  );
}
