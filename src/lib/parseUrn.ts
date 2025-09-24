export const parseUrn = (urn: string) => {
  const parts = urn.split('/');
  return {
    space: parts[1],
    environment: parts[3],
    entryId: parts[5],
  };
};
