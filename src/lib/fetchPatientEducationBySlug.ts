import { getClient } from "@/lib/contentful";
import type { PatientEducationEntry } from "./types";

export async function fetchPatientEducationBySlug(params: {
  slug: string;
  locale?: string;
}): Promise<PatientEducationEntry | null> {
  try {
    const { locale, slug } = params;
    const client = getClient();
    const contentTypeId = process.env.CONTENTFUL_PDF_GEN_CT;

    const query: Record<string, unknown> = {
      content_type: contentTypeId,
      limit: 1,
      include: 2,
      "fields.slug": slug,
    };

    if (locale) {
      query.locale = locale;
    }

    const response = await client.getEntries(query);

    if (!response.items.length) {
      return null;
    }

    return response.items[0] as PatientEducationEntry;
  } catch (error) {
    console.error("Contentful fetch error:", error);
    return null;
  }
}
