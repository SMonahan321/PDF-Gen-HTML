import { getClientForChildrensSpace } from "./contentful";
import { parseUrn, UrnParseError } from "./parseUrn";

export const fetchByUrn = async (urn: string) => {
  try {
    const { space, environment, entryId } = parseUrn(urn);
    const client = getClientForChildrensSpace(space, environment);
    return await client.getEntry(entryId);
  } catch (error) {
    if (error instanceof UrnParseError) {
      console.error(`Failed to parse URN: ${error.message}`, {
        urn: error.urn,
      });
      throw new Error(`Invalid URN format: ${error.urn}`);
    }
    console.error(`Failed to fetch entry by URN: ${urn}`, error);
    throw error;
  }
};
