/**
 * Calculate the effective lineup for a given inning,
 * applying all substitutions that occurred up to and including that inning.
 */
export function getEffectiveLineup(lineup, substitutions, inning) {
  // Start with the original lineup
  let effective = lineup.map((e) => ({ ...e }));

  // Apply substitutions in inning order
  const applicableSubs = [...substitutions]
    .filter((s) => !s.isOpponent && s.inning <= inning)
    .sort((a, b) => a.inning - b.inning);

  for (const sub of applicableSubs) {
    const idx = effective.findIndex((e) => e.playerId === sub.outPlayerId);
    if (idx !== -1) {
      effective[idx] = {
        ...effective[idx],
        playerId: sub.inPlayerId,
        position: sub.position,
      };
    }
  }
  return effective;
}

export function getEffectiveOpponentLineup(opponentLineup, substitutions, inning) {
  let effective = opponentLineup.map((e) => ({ ...e }));

  const applicableSubs = [...substitutions]
    .filter((s) => s.isOpponent && s.inning <= inning)
    .sort((a, b) => a.inning - b.inning);

  for (const sub of applicableSubs) {
    const idx = effective.findIndex((e) => e.order === sub.battingOrder);
    if (idx !== -1) {
      effective[idx] = {
        ...effective[idx],
        name: sub.inPlayerName,
        number: sub.inPlayerNumber || effective[idx].number,
        position: sub.position,
      };
    }
  }
  return effective;
}
