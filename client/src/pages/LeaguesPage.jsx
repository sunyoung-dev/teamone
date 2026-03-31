import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Fab from '@mui/material/Fab';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';

import { getLeagues, createLeague, updateLeague, deleteLeague } from '../api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

const DEFAULT_TOURNAMENT_ROUNDS = ['예선', '16강', '8강', '4강', '결승'];

const EMPTY_FORM = {
  name: '',
  season: new Date().getFullYear().toString(),
  format: 'league',
  rounds: [],
  organizer: '',
  description: '',
  startDate: '',
  endDate: '',
};

function RoundsEditor({ rounds, onChange }) {
  const [newRound, setNewRound] = useState('');

  const addRound = () => {
    const trimmed = newRound.trim();
    if (!trimmed || rounds.includes(trimmed)) return;
    onChange([...rounds, trimmed]);
    setNewRound('');
  };

  const removeRound = (r) => onChange(rounds.filter((x) => x !== r));

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
        라운드 구성
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
        {rounds.map((r) => (
          <Chip key={r} label={r} size="small" onDelete={() => removeRound(r)} />
        ))}
        {rounds.length === 0 && (
          <Typography variant="caption" color="text.disabled">라운드를 추가하세요</Typography>
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          size="small"
          placeholder="예: 4강"
          value={newRound}
          onChange={(e) => setNewRound(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRound(); } }}
          sx={{ flex: 1 }}
        />
        <Button variant="outlined" size="small" onClick={addRound} disabled={!newRound.trim()}>추가</Button>
      </Box>
    </Box>
  );
}

function CompetitionFormDialog({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initial || EMPTY_FORM);
  }, [initial, open]);

  const handle = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleFormatChange = (_, newFormat) => {
    if (!newFormat) return;
    setForm((p) => ({
      ...p,
      format: newFormat,
      rounds: newFormat === 'tournament' && p.rounds.length === 0 ? [...DEFAULT_TOURNAMENT_ROUNDS] : p.rounds,
    }));
  };

  const handleSave = async () => {
    if (!form.name || !form.season) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { mx: 2, borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>{initial ? '대회 수정' : '대회 추가'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        {/* Format toggle */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 0.75, display: 'block' }}>
            대회 유형
          </Typography>
          <ToggleButtonGroup
            exclusive
            value={form.format}
            onChange={handleFormatChange}
            size="small"
            fullWidth
          >
            <ToggleButton value="league" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>리그전</ToggleButton>
            <ToggleButton value="tournament" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>토너먼트</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <TextField label="대회명 *" value={form.name} onChange={handle('name')} fullWidth placeholder="예: 2026 수도권 여자야구리그" />
        <TextField label="시즌 *" value={form.season} onChange={handle('season')} fullWidth placeholder="예: 2026" />
        <TextField label="주최" value={form.organizer} onChange={handle('organizer')} fullWidth placeholder="예: 수도권야구협회" />
        <TextField label="설명" value={form.description} onChange={handle('description')} fullWidth multiline rows={2} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField label="시작일" type="date" value={form.startDate} onChange={handle('startDate')} fullWidth InputLabelProps={{ shrink: true }} />
          <TextField label="종료일" type="date" value={form.endDate} onChange={handle('endDate')} fullWidth InputLabelProps={{ shrink: true }} />
        </Box>

        {form.format === 'tournament' && (
          <RoundsEditor rounds={form.rounds} onChange={(r) => setForm((p) => ({ ...p, rounds: r }))} />
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" sx={{ flex: 1 }}>취소</Button>
        <Button onClick={handleSave} variant="contained" disabled={!form.name || !form.season || saving} sx={{ flex: 2 }}>
          {saving ? '저장 중...' : '저장'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function CompetitionCard({ comp, onEdit, onDelete }) {
  const isTournament = comp.format === 'tournament';
  return (
    <Card>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{comp.name}</Typography>
              <Chip label={comp.season} size="small" color="primary" sx={{ fontWeight: 700 }} />
              {isTournament && (
                <Chip label="토너먼트" size="small" color="warning" variant="outlined" sx={{ fontWeight: 700 }} />
              )}
            </Box>
            {comp.organizer && (
              <Typography variant="body2" color="text.secondary">{comp.organizer}</Typography>
            )}
            {comp.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{comp.description}</Typography>
            )}
            {(comp.startDate || comp.endDate) && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {comp.startDate} ~ {comp.endDate}
              </Typography>
            )}
            {isTournament && comp.rounds?.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.75 }}>
                {comp.rounds.map((r) => (
                  <Chip key={r} label={r} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                ))}
              </Box>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
            <IconButton size="small" onClick={() => onEdit(comp)}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" color="error" onClick={() => onDelete(comp.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function LeaguesPage() {
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const load = () => {
    setLoading(true);
    getLeagues()
      .then((res) => setLeagues(res.data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (form) => {
    if (editTarget) {
      await updateLeague(editTarget.id, form);
    } else {
      await createLeague(form);
    }
    setFormOpen(false);
    setEditTarget(null);
    load();
  };

  const handleDelete = async () => {
    await deleteLeague(deleteId);
    setDeleteId(null);
    load();
  };

  if (loading) return <LoadingSpinner />;

  const tournaments = leagues.filter((l) => l.format === 'tournament');
  const leagueList = leagues.filter((l) => l.format !== 'tournament');

  const isEmpty = leagues.length === 0;

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {isEmpty && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <EmojiEventsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="body1" color="text.secondary">등록된 대회가 없습니다</Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>+ 버튼으로 대회를 추가하세요</Typography>
        </Box>
      )}

      {/* 토너먼트 섹션 */}
      {tournaments.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <EmojiEventsIcon sx={{ color: '#b45309' }} fontSize="small" />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#b45309' }}>전국대회 / 토너먼트</Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {tournaments.map((comp) => (
              <CompetitionCard
                key={comp.id}
                comp={comp}
                onEdit={(c) => { setEditTarget(c); setFormOpen(true); }}
                onDelete={(id) => setDeleteId(id)}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* 리그전 섹션 */}
      {leagueList.length > 0 && (
        <Box>
          {tournaments.length > 0 && (
            <>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <FormatListBulletedIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }} color="primary">리그전</Typography>
              </Box>
            </>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {leagueList.map((comp) => (
              <CompetitionCard
                key={comp.id}
                comp={comp}
                onEdit={(c) => { setEditTarget(c); setFormOpen(true); }}
                onDelete={(id) => setDeleteId(id)}
              />
            ))}
          </Box>
        </Box>
      )}

      <Fab
        color="secondary"
        aria-label="대회 추가"
        onClick={() => { setEditTarget(null); setFormOpen(true); }}
        sx={{ position: 'fixed', bottom: 80, right: 16 }}
      >
        <AddIcon />
      </Fab>

      <CompetitionFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null); }}
        onSave={handleSave}
        initial={editTarget}
      />

      {/* 삭제 확인 */}
      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { mx: 2, borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>대회 삭제</DialogTitle>
        <DialogContent>
          <Typography variant="body2">이 대회를 삭제하시겠습니까?</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
          <Button onClick={() => setDeleteId(null)} variant="outlined" sx={{ flex: 1 }}>취소</Button>
          <Button onClick={handleDelete} variant="contained" color="error" sx={{ flex: 2 }}>삭제</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
