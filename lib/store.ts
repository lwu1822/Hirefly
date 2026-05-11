import { CANDIDATES, ROLES, COMPANIES, type Candidate, type Role, type Company, type RubricWeights, type RoleCriteria, type RoleLabels, type CustomCategory } from "./data";

// In-memory store (resets on server restart — fine for demo)
let candidates = [...CANDIDATES];
let roles = [...ROLES];
let companies = [...COMPANIES];

export function getCompanies(): Company[] { return [...companies]; }
export function getCompanyById(id: string): Company | undefined { return companies.find(c => c.id === id); }
export function addCompany(company: Company) { companies.push(company); }
export function deleteCompany(id: string) { companies = companies.filter(c => c.id !== id); }

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

export function closeRole(id: string) {
  const role = roles.find(r => r.id === id);
  if (role) role.status = "closed";
}

export function reopenRole(id: string) {
  const role = roles.find(r => r.id === id);
  if (role) role.status = "open";
}

export function updateRubric(roleId: string, rubric: RubricWeights) {
  const role = roles.find(r => r.id === roleId);
  if (role) role.rubric = rubric;
}

export function updateRoleCriteria(roleId: string, criteria: RoleCriteria) {
  const role = roles.find(r => r.id === roleId);
  if (role) role.criteria = criteria;
}

export function updateRoleLabels(roleId: string, labels: RoleLabels) {
  const role = roles.find(r => r.id === roleId);
  if (role) role.labels = labels;
}

export function getCandidatesForRole(roleId: string, rubric?: RubricWeights): Candidate[] {
  const role = roles.find(r => r.id === roleId);
  const weights = rubric ?? role?.rubric ?? { gca: 25, rrk: 35, leadership: 20, googleyness: 20 };
  const customCats = role?.customCategories;
  return candidates
    .filter(c => c.roleId === roleId && c.status !== "rejected")
    .map(c => ({ ...c, overall: computeScore(c, weights, customCats) }))
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

export function updateCandidateFolder(id: string, folder: string | undefined) {
  const c = candidates.find(c => c.id === id);
  if (c) c.folder = folder;
}

export function cloneCandidateToRole(candidateId: string, newRoleId: string): Candidate | null {
  const c = candidates.find(c => c.id === candidateId);
  if (!c) return null;
  const clone: Candidate = {
    ...c,
    id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    roleId: newRoleId,
    status: "pending",
    folder: undefined,
  };
  candidates.push(clone);
  return clone;
}

export function getFoldersForRole(roleId: string): string[] {
  const seen = new Set<string>();
  candidates
    .filter(c => c.roleId === roleId && c.folder)
    .forEach(c => seen.add(c.folder!));
  return [...seen].sort();
}

export function updateCandidateScores(
  id: string,
  scores: { gca: number; rrk: number; leadership: number; googleyness: number; evidence: string[]; customScores?: Record<string, number>; rationale?: Record<string, string> }
) {
  const c = candidates.find(c => c.id === id);
  if (c) {
    c.gca = scores.gca;
    c.rrk = scores.rrk;
    c.leadership = scores.leadership;
    c.googleyness = scores.googleyness;
    c.evidence = scores.evidence;
    if (scores.customScores) c.customScores = { ...c.customScores, ...scores.customScores };
    if (scores.rationale) c.rationale = scores.rationale;
  }
}

export function updateCustomCategories(roleId: string, cats: CustomCategory[]) {
  const role = roles.find(r => r.id === roleId);
  if (role) role.customCategories = cats;
}

export function computeScore(c: Candidate, weights: RubricWeights, customCats?: CustomCategory[]): number {
  let total = weights.gca + weights.rrk + weights.leadership + weights.googleyness;
  let sum = c.gca * weights.gca + c.rrk * weights.rrk + c.leadership * weights.leadership + c.googleyness * weights.googleyness;
  if (customCats?.length && c.customScores) {
    for (const cat of customCats) {
      total += cat.weight;
      sum += (c.customScores[cat.key] ?? 0) * cat.weight;
    }
  }
  return total === 0 ? 0 : sum / total;
}
