import { createClient } from "contentful";
import { createClient as createManagementClient } from "contentful-management";

export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function getClient() {
  const spaceId = getRequiredEnv("CONTENTFUL_SPACE");
  const accessToken = getRequiredEnv("CONTENTFUL_DELIVERY_API");
  const environment = process.env.CONTENTFUL_ENVIRONMENT || "develop";
  return createClient({ space: spaceId, accessToken, environment });
}

export function getClientForChildrensSpace(spaceId: string, environment: string = 'master') {
  const accessToken = getRequiredEnv("CONTENTFUL_CHILDREN_S_SPACE_DELIVERY_API");
  return createClient({ space: spaceId, accessToken, environment });
}

export function getManagementClient() {
  const accessToken = getRequiredEnv("CONTENTFUL_MANAGEMENT_TOKEN");
  return createManagementClient({ accessToken });
}

export function getManagementClientForSpace(spaceId: string) {
  const accessToken = getRequiredEnv("CONTENTFUL_MANAGEMENT_TOKEN");
  return createManagementClient({ accessToken }).getSpace(spaceId);
}
