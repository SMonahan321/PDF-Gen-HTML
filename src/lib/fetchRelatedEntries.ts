import { fetchByUrn } from './fetchByUrn';
import type { ConditionEntry, TreatmentEntry, ResourceLink } from './types';

export async function fetchRelatedEntries(
  entries: (ConditionEntry | TreatmentEntry | ResourceLink)[]
): Promise<(ConditionEntry | TreatmentEntry)[]> {
  const results = await Promise.allSettled(
    entries.map(async (entry) => {
      if (entry?.sys?.type === 'ResourceLink') {
        try {
          return await fetchByUrn(entry.sys.urn);
        } catch (error) {
          console.error(`Failed to fetch entry with URN ${entry.sys.urn}:`, error);
          return null;
        }
      }
      return entry;
    })
  );

  return results
    .filter((result): result is PromiseFulfilledResult<ConditionEntry | TreatmentEntry> => 
      result.status === 'fulfilled' && result.value !== null
    )
    .map(result => result.value);
}
