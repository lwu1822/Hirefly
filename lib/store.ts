import { CANDIDATES, ROLES, type Candidate, type Role, type RubricWeights } from "./data";

// In-memory store (resets on server restart — fine for demo)
let candidates = [...CANDIDATES];
let roles = [...ROLES];

export function getRoles(): Role[] {
  return roles.map(r => ({
    ...r,
    candidateCount: candidates.filter(c => c.roleId === r.id).length,
  } as Role & { candidateCount: number }));
}

export function getRoleById(id: string): Role | undefined {
  return roles.find(r => r.id === id);
}

export function addRole(role: Role) {
  roles.push(role);
}

export function removeRole(id: string) {
  roles = roles.filter(r => r.id !== id);
}

export function updateRubric(roleId: string, rubric: RubricWeights) {
  const role = roles.find(r => r.id === roleId);
  if (role) role.rubric = rubric;
}

export function getCandidatesForRole(roleId: string, rubric?: RubricWeights): Candidate[] {
  const role = roles.find(r => r.id === roleId);
  const weights = rubric ?? role?.rubric ?? { gca: 25, rrk: 35, leadership: 20, googleyness: 20 };
  return candidates
    .filter(c => c.roleId === roleId && c.status !== "rejected")
    .map(c => ({ ...c, overall: computeScore(c, weights) }))
    .sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0));
}

export function getCandidateById(id: string): Candidate | undefined {
  return candidates.find(c => c.id === id);
}

export function updateCandidateStatus(id: string, status: Candidate["status"]) {
  const c = candidates.find(c => c.id === id);
  if (c) c.status = status;
}

export function addCandidate(candidate: Candidate) {
  candidates.push(candidate);
}

export function updateCandidateScores(
  id: string,
  scores: { gca: number; rrk: number; leadership: number; googleyness: number; evidence: string[] }
) {
  const c = candidates.find(c => c.id === id);
  if (c) {
    c.gca = scores.gca;
    c.rrk = scores.rrk;
    c.leadership = scores.leadership;
    c.googleyness = scores.googleyness;
    c.evidence = scores.evidence;
  }
}

export function computeScore(c: Candidate, weights: RubricWeights): number {
  const total = weights.gca + weights.rrk + weights.leadership + weights.googleyness;
  if (total === 0) return 0;
  return (
    (c.gca * weights.gca + c.rrk * weights.rrk + c.leadership * weights.leadership + c.googleyness * weights.googleyness) / total
  );
}
