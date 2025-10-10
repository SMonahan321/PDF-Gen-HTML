import { createClient } from "contentful-management";

export function getManagementClient() {
  const accessToken = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
  return createClient({ accessToken });
}

export function getManagementClientForSpace(spaceId: string) {
  const accessToken = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
  return createClient({ accessToken }).getSpace(spaceId);
}
