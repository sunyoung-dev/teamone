// Client-side stat formatting utilities

export function formatAvg(val) {
  if (val == null || isNaN(val)) return '.000';
  const str = val.toFixed(3);
  // Remove leading zero for AVG/OBP/SLG style
  return str.startsWith('0.') ? str.slice(1) : str;
}

export function formatOps(val) {
  if (val == null || isNaN(val)) return '.000';
  if (val >= 1) return val.toFixed(3);
  const str = val.toFixed(3);
  return str.startsWith('0.') ? str.slice(1) : str;
}

export function formatStat(val, decimals = 0) {
  if (val == null || isNaN(val)) return '0';
  return Number(val).toFixed(decimals);
}

export function getResultType(code) {
  const hits = ['1H', '2H', '3H', 'HR'];
  const outsWithAB = ['GO', 'FO', 'SO', 'DP', 'E'];
  const onBaseNoAB = ['BB', 'HBP'];
  const sacrifices = ['SF', 'SH'];

  if (hits.includes(code)) return 'hit';
  if (outsWithAB.includes(code)) return 'out';
  if (onBaseNoAB.includes(code)) return 'onBase';
  if (sacrifices.includes(code)) return 'sacrifice';
  return 'unknown';
}

export function isHit(code) {
  return ['1H', '2H', '3H', 'HR'].includes(code);
}

export function countsAsAtBat(code) {
  // BB, HBP, SF, SH do NOT count as at-bats
  return !['BB', 'HBP', 'SF', 'SH'].includes(code);
}
