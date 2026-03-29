import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DeleteIcon from '@mui/icons-material/Delete';

import { getPlayer, createPlayer, updatePlayer, deletePlayer } from '../api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { POSITIONS } from '../utils/constants.js';

const EMPTY_FORM = {
  name: '',
  number: '',
  position: 'SS',
  battingHand: 'R',
  throwingHand: 'R',
  active: true,
};

export default function PlayerFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id) && id !== 'new';

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    getPlayer(id)
      .then((res) => {
        const p = res.data || res;
        setForm({
          name: p.name || '',
          number: p.number ?? '',
          position: p.position || 'SS',
          battingHand: p.battingHand || 'R',
          throwingHand: p.throwingHand || 'R',
          active: p.active !== false,
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        number: Number(form.number),
      };
      if (isEdit) {
        await updatePlayer(id, payload);
        navigate(`/players/${id}`);
      } else {
        const res = await createPlayer(payload);
        const newId = res.data?.id || res.id;
        navigate(`/players/${newId}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deletePlayer(id);
      navigate('/players');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
    setDeleteDialogOpen(false);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 2, pb: 10 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>선수 정보</Typography>
          <Grid container spacing={2}>
            <Grid item xs={8}>
              <TextField
                label="이름"
                value={form.name}
                onChange={handleChange('name')}
                fullWidth
                required
                placeholder="예: 김수영"
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="등번호"
                type="number"
                value={form.number}
                onChange={handleChange('number')}
                fullWidth
                required
                inputProps={{ min: 0, max: 99 }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>포지션</InputLabel>
                <Select value={form.position} onChange={handleChange('position')} label="포지션">
                  {POSITIONS.map((pos) => (
                    <MenuItem key={pos.code} value={pos.code}>
                      {pos.label} ({pos.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>타석</InputLabel>
                <Select value={form.battingHand} onChange={handleChange('battingHand')} label="타석">
                  <MenuItem value="R">우타 (R)</MenuItem>
                  <MenuItem value="L">좌타 (L)</MenuItem>
                  <MenuItem value="S">스위치 (S)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>투구손</InputLabel>
                <Select value={form.throwingHand} onChange={handleChange('throwingHand')} label="투구손">
                  <MenuItem value="R">우투 (R)</MenuItem>
                  <MenuItem value="L">좌투 (L)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        size="large"
        disabled={saving}
        sx={{ mb: 1.5 }}
      >
        {saving ? '저장 중...' : isEdit ? '수정 완료' : '선수 등록'}
      </Button>

      {isEdit && (
        <Button
          variant="outlined"
          color="error"
          fullWidth
          startIcon={<DeleteIcon />}
          onClick={() => setDeleteDialogOpen(true)}
        >
          선수 삭제
        </Button>
      )}

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>선수 삭제</DialogTitle>
        <DialogContent>
          <Typography>정말 이 선수를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>취소</Button>
          <Button onClick={handleDelete} color="error" variant="contained">삭제</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
