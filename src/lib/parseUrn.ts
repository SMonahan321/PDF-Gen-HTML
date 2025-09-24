export interface ParsedUrn {
  space: string;
  environment: string;
  entryId: string;
}

export class UrnParseError extends Error {
  constructor(message: string, public urn: string) {
    super(message);
    this.name = 'UrnParseError';
  }
}

export const parseUrn = (urn: string): ParsedUrn => {
  if (!urn || typeof urn !== 'string') {
    throw new UrnParseError('URN must be a non-empty string', urn);
  }

  const parts = urn.split('/');
  
  // Expected URN format: urn:space:spaceId/environment:environmentId/entry:entryId
  if (parts.length < 6) {
    throw new UrnParseError(
      `Invalid URN format. Expected at least 6 parts, got ${parts.length}. URN: ${urn}`,
      urn
    );
  }

  const space = parts[1];
  const environment = parts[3];
  const entryId = parts[5];

  if (!space || !environment || !entryId) {
    throw new UrnParseError(
      `Missing required URN components. Space: ${space}, Environment: ${environment}, EntryId: ${entryId}`,
      urn
    );
  }

  return {
    space,
    environment,
    entryId,
  };
};
