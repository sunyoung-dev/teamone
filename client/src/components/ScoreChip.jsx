import React from 'react';
import Chip from '@mui/material/Chip';

const CONFIG = {
  W: { label: '승', color: 'success' },
  L: { label: '패', color: 'error' },
  D: { label: '무', color: 'default' },
};

export default function ScoreChip({ result, size = 'small' }) {
  if (!result) return null;
  const { label, color } = CONFIG[result] || { label: result, color: 'default' };
  return (
    <Chip
      label={label}
      color={color}
      size={size}
      sx={{ fontWeight: 700, minWidth: 36 }}
    />
  );
}
