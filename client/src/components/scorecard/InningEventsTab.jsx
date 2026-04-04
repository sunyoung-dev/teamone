import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { INNING_EVENT_TYPES, FIELDER_POSITIONS } from '../../utils/constants.js';
import InningEventModal from './InningEventModal.jsx';
import {
  addInningEvent, updateInningEvent, deleteInningEvent,
} from '../../api.js';

const BASE_LABEL = { 1: '1루', 2: '2루', 3: '3루', 4: '홈', 0: '아웃' };

function EventCard({ event, players, onEdit, onDelete }) {
  const typeInfo = INNING_EVENT_TYPES[event.type] || { code: event.type, label: event.type, color: '#666', bg: '#eee' };
  const fielderInfo = event.fielderPos != null ? FIELDER_POSITIONS.find(f => f.num === event.fielderPos) : null;
  const pitcher = players.find(p => (p.id || p._id) === event.pitcherId);

  return (
    <Card variant="outlined" sx={{ mb: 1, borderRadius: 2, borderColor: typeInfo.color + '44' }}>
      <CardContent sx={{ py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          {/* 타입 배지 */}
          <Box
            sx={{
              minWidth: 42, height: 42, borderRadius: 1.5,
              bgcolor: typeInfo.bg,
              border: `2px solid ${typeInfo.color}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: typeInfo.color, fontFamily: '"Roboto Mono", monospace', lineHeight: 1 }}>
              {typeInfo.code}
            </Typography>
          </Box>

          {/* 내용 */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25, flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {typeInfo.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {event.inning}회
              </Typography>
              {event.runnerName && (
                <Chip label={event.runnerName} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
              )}
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {event.fromBase != null && event.toBase != null && (
                <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: '"Roboto Mono", monospace' }}>
                  {BASE_LABEL[event.fromBase] || `${event.fromBase}루`} → {BASE_LABEL[event.toBase]}
                </Typography>
              )}
              {fielderInfo && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  · {fielderInfo.num}({fielderInfo.code}) {fielderInfo.label}
                </Typography>
              )}
              {pitcher && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  · 투수: {pitcher.name}
                </Typography>
              )}
              {event.note && (
                <Typography variant="caption" color="text.disabled" sx={{ width: '100%' }}>
                  {event.note}
                </Typography>
              )}
            </Box>
          </Box>

          {/* 액션 */}
          <Box sx={{ display: 'flex', gap: 0.25, flexShrink: 0 }}>
            <IconButton size="small" onClick={() => onEdit(event)} sx={{ color: 'text.secondary' }}>
              <EditIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <IconButton size="small" onClick={() => onDelete(event.id)} sx={{ color: 'error.light' }}>
              <DeleteIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function InningEventsTab({ gameId, events, setEvents, players, maxInning }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [saving, setSaving] = useState(false);

  // 이닝별로 그룹화
  const byInning = {};
  for (let i = 1; i <= maxInning; i++) byInning[i] = [];
  for (const ev of events) {
    const inn = ev.inning;
    if (!byInning[inn]) byInning[inn] = [];
    byInning[inn].push(ev);
  }

  const usedInnings = Object.entries(byInning)
    .filter(([, evs]) => evs.length > 0)
    .map(([inn]) => Number(inn))
    .sort((a, b) => a - b);

  const handleOpenAdd = () => {
    setEditingEvent(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (event) => {
    setEditingEvent(event);
    setModalOpen(true);
  };

  const handleConfirm = async (data) => {
    setSaving(true);
    try {
      if (editingEvent) {
        const res = await updateInningEvent(gameId, editingEvent.id, data);
        const updated = res.data;
        setEvents(prev => prev.map(ev => ev.id === editingEvent.id ? updated : ev));
      } else {
        const res = await addInningEvent(gameId, data);
        const created = res.data;
        setEvents(prev => [...prev, created]);
      }
      setModalOpen(false);
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('이 이벤트를 삭제할까요?')) return;
    try {
      await deleteInningEvent(gameId, eventId);
      setEvents(prev => prev.filter(ev => ev.id !== eventId));
    } catch (e) {
      alert(e.message);
    }
  };

  // 이벤트 유형별 요약 통계
  const summary = {};
  for (const ev of events) {
    summary[ev.type] = (summary[ev.type] || 0) + 1;
  }

  return (
    <Box sx={{ pb: 10 }}>
      {/* 요약 칩 */}
      {events.length > 0 && (
        <Box sx={{ px: 2, pt: 2, pb: 1, display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
          {Object.entries(summary).map(([code, count]) => {
            const info = INNING_EVENT_TYPES[code] || { code, label: code, color: '#666', bg: '#eee' };
            return (
              <Chip
                key={code}
                label={`${info.label} ${count}`}
                size="small"
                sx={{
                  bgcolor: info.bg,
                  color: info.color,
                  border: `1px solid ${info.color}`,
                  fontWeight: 700,
                  fontFamily: '"Roboto Mono", monospace',
                }}
              />
            );
          })}
        </Box>
      )}

      {/* 이벤트 없을 때 */}
      {events.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6, px: 3 }}>
          <Typography variant="h5" sx={{ mb: 1 }}>⚡</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
            기록된 이벤트가 없습니다
          </Typography>
          <Typography variant="caption" color="text.disabled">
            도루, 폭투, 포일, 보크 등을 + 버튼으로 추가하세요
          </Typography>
        </Box>
      )}

      {/* 이닝별 이벤트 목록 */}
      {usedInnings.map(inn => (
        <Box key={inn} sx={{ px: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, pt: inn === usedInnings[0] ? 1 : 0 }}>
            <Box sx={{
              width: 32, height: 32, borderRadius: '50%',
              bgcolor: '#0d1b3e', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, fontFamily: '"Roboto Mono", monospace' }}>
                {inn}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              {inn}회
            </Typography>
          </Box>
          {byInning[inn].map(ev => (
            <EventCard
              key={ev.id}
              event={ev}
              players={players}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
            />
          ))}
        </Box>
      ))}

      {/* 추가 FAB */}
      <Fab
        color="primary"
        onClick={handleOpenAdd}
        sx={{ position: 'fixed', bottom: 80, right: 16, zIndex: 1000 }}
      >
        <AddIcon />
      </Fab>

      {/* 이벤트 입력 모달 */}
      <InningEventModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirm}
        maxInning={maxInning}
        players={players}
        initialData={editingEvent}
      />
    </Box>
  );
}
