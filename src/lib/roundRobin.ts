export type MatchPair = { teamAId: string; teamBId: string };

/**
 * Circle method round-robin: for n teams returns n-1 rounds (n even) where every
 * pair plays exactly once and no team repeats within a round. Odd team counts get
 * a bye each round (that team simply has no match that round).
 */
export function roundRobinRounds(teamIds: string[]): MatchPair[][] {
  if (teamIds.length < 2) return [];
  const ids = [...teamIds];
  if (ids.length % 2 !== 0) ids.push('');
  const n = ids.length;
  const arr = [...ids];
  const rounds: MatchPair[][] = [];

  for (let r = 0; r < n - 1; r++) {
    const pairs: MatchPair[] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      if (a && b) pairs.push({ teamAId: a, teamBId: b });
    }
    rounds.push(pairs);
    arr.splice(1, 0, arr.pop()!);
  }
  return rounds;
}

export type GroupFixture = { groupId: string; teamAId: string; teamBId: string };

/**
 * Generates a single round-robin fixture per group, then interleaves the groups'
 * rounds (round 1 of every group, then round 2 of every group, ...) into one
 * flat, sequential play order.
 */
export function generateGroupFixtures(groups: { groupId: string; teamIds: string[] }[]): GroupFixture[] {
  const perGroupRounds = groups.map((g) =>
    roundRobinRounds(g.teamIds).map((round) => round.map((p) => ({ groupId: g.groupId, ...p })))
  );
  const maxRounds = Math.max(0, ...perGroupRounds.map((r) => r.length));
  const flat: GroupFixture[] = [];
  for (let r = 0; r < maxRounds; r++) {
    for (const rounds of perGroupRounds) {
      if (rounds[r]) flat.push(...rounds[r]);
    }
  }
  return flat;
}
