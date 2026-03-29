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
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

import { getLeagues, createLeague, updateLeague, deleteLeague } from '../api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

const EMPTY_FORM = { name: '', season: new Date().getFullYear().toString(), organizer: '', description: '', startDate: '', endDate: '' };

function LeagueFormDialog({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(initial || EMPTY_FORM); }, [initial, open]);

  const handle = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSave = async () => {
    if (!form.name || !form.season) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { mx: 2, borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>{initial ? '리그 수정' : '리그 추가'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        <TextField label="리그명 *" value={form.name} onChange={handle('name')} fullWidth placeholder="예: 2026 수도권 여자야구리그" />
        <TextField label="시즌 *" value={form.season} onChange={handle('season')} fullWidth placeholder="예: 2026" />
        <TextField label="주최" value={form.organizer} onChange={handle('organizer')} fullWidth placeholder="예: 수도권야구협회" />
        <TextField label="설명" value={form.description} onChange={handle('description')} fullWidth multiline rows={2} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField label="시작일" type="date" value={form.startDate} onChange={handle('startDate')} fullWidth InputLabelProps={{ shrink: true }} />
          <TextField label="종료일" type="date" value={form.endDate} onChange={handle('endDate')} fullWidth InputLabelProps={{ shrink: true }} />
        </Box>
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
      .then(res => setLeagues(res.data || []))
      .catch(err => setError(err.message))
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

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {leagues.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <EmojiEventsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="body1" color="text.secondary">등록된 리그가 없습니다</Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>+ 버튼으로 리그를 추가하세요</Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {leagues.map(league => (
          <Card key={league.id}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{league.name}</Typography>
                    <Chip label={league.season} size="small" color="primary" sx={{ fontWeight: 700 }} />
                  </Box>
                  {league.organizer && (
                    <Typography variant="body2" color="text.secondary">{league.organizer}</Typography>
                  )}
                  {league.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{league.description}</Typography>
                  )}
                  {(league.startDate || league.endDate) && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      {league.startDate} ~ {league.endDate}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                  <IconButton size="small" onClick={() => { setEditTarget(league); setFormOpen(true); }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => setDeleteId(league.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Fab color="secondary" aria-label="리그 추가" onClick={() => { setEditTarget(null); setFormOpen(true); }} sx={{ position: 'fixed', bottom: 80, right: 16 }}>
        <AddIcon />
      </Fab>

      <LeagueFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null); }}
        onSave={handleSave}
        initial={editTarget}
      />

      {/* 삭제 확인 */}
      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { mx: 2, borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>리그 삭제</DialogTitle>
        <DialogContent>
          <Typography variant="body2">이 리그를 삭제하시겠습니까?</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
          <Button onClick={() => setDeleteId(null)} variant="outlined" sx={{ flex: 1 }}>취소</Button>
          <Button onClick={handleDelete} variant="contained" color="error" sx={{ flex: 2 }}>삭제</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
