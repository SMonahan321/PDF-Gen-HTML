import {parseUrn} from './parseUrn';
import {getClientForChildrensSpace} from './contentful';

export const fetchByUrn = async (urn: string) => {
  const { space, environment, entryId } = parseUrn(urn);

  const client = getClientForChildrensSpace(space, environment);

  return await client.getEntry(entryId);
}