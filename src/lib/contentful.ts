import { createClient } from "contentful";

export function getClient() {
  const spaceId = process.env.CONTENTFUL_SPACE;
  const accessToken = process.env.CONTENTFUL_DELIVERY_API;
  const environment = process.env.CONTENTFUL_ENVIRONMENT || "develop";
  return createClient({ space: spaceId, accessToken, environment });
}

export function getClientForChildrensSpace(spaceId: string, environment: string = 'master') {
  const accessToken = process.env.CONTENTFUL_CHILDREN_S_SPACE_DELIVERY_API;
  return createClient({ space: spaceId, accessToken, environment });
}
