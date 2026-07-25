import { Criterion, CriteriaGroup } from '../types';

/**
 * Returns criteria ordered grouped by their group ID according to the order of groups.
 * Ensures criteria belonging to the same group are strictly contiguous.
 */
export function getOrderedCriteria(criteria: Criterion[], groups: CriteriaGroup[]): Criterion[] {
  const ordered: Criterion[] = [];
  groups.forEach((group) => {
    criteria.forEach((c) => {
      if (c.groupId === group.id) {
        ordered.push(c);
      }
    });
  });
  // Include orphan criteria (if any)
  criteria.forEach((c) => {
    if (!ordered.some((oc) => oc.id === c.id)) {
      ordered.push(c);
    }
  });
  return ordered;
}
