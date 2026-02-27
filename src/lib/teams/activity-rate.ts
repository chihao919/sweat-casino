/**
 * Calculates the activity rate — the proportion of team members who ran
 * at least once in the measured period.
 *
 * Returns a value in the range [0, 1].
 */
export function calculateActivityRate(
  activeMembers: number,
  totalMembers: number
): number {
  if (totalMembers === 0) {
    return 0;
  }

  return activeMembers / totalMembers;
}

/**
 * Calculates the adjusted team score used for leaderboard ranking.
 *
 * Raw total kilometres are penalised by the fraction of inactive members,
 * incentivising teams to keep every member engaged rather than relying on
 * a few high-mileage athletes to carry the team.
 *
 * Formula: totalKm * (activeMembers / totalMembers)
 */
export function calculateAdjustedScore(
  totalKm: number,
  activeMembers: number,
  totalMembers: number
): number {
  if (totalMembers === 0) {
    return 0;
  }

  const activityRate = calculateActivityRate(activeMembers, totalMembers);
  return totalKm * activityRate;
}
