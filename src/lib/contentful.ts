import { createClient } from "contentful";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function getClient() {
  const spaceId = getRequiredEnv("CONTENTFUL_SPACE");
  const accessToken = getRequiredEnv("CONTENTFUL_DELIVERY_API");
  const environment = process.env.CONTENTFUL_ENVIRONMENT || "develop";
  return createClient({ space: spaceId, accessToken, environment });
}

export async function fetchPatientEducationBySlug(params: {
  slug: string;
  locale?: string;
}): Promise<any | null> {
  try {
    const { locale, slug } = params;
    const client = getClient();
    const contentTypeId = getRequiredEnv("CONTENTFUL_PDF_GEN_CT");

    const query: Record<string, unknown> = {
      content_type: contentTypeId,
      limit: 1,
      include: 2,
      "fields.slug": slug,
    };
    if (locale) query.locale = locale;

    const response = await client.getEntries(query);
    if (!response.items.length) return null;
    return response.items[0];
  } catch (error) {
    console.error("Contentful fetch error:", error);
    return null;
  }
}


