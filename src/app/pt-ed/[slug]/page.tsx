import { notFound } from "next/navigation";
import PatientEducationPage from "@/components/PatientEducation/PatientEducationPage";
import { fetchPatientEducationBySlug } from "@/lib/fetchPatientEducationBySlug";
import { fetchRelatedEntries } from "@/lib/fetchRelatedEntries";
import type { PatientEducationEntry } from "@/lib/types";

type PageProps = {
  params: Promise<{ slug: string }>;
};

// Render dynamically on the server so any slug works in production
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  // Fetch the main patient education entry
  const entry = await fetchPatientEducationBySlug({ slug });
  if (!entry) {
    return notFound();
  }

  const typedEntry = entry as PatientEducationEntry;

  // Fetch related entries in parallel
  const [relatedConditions, relatedTreatments] = await Promise.all([
    typedEntry.fields.relatedConditions
      ? fetchRelatedEntries(typedEntry.fields.relatedConditions)
      : Promise.resolve([]),
    typedEntry.fields.relatedTreatments
      ? fetchRelatedEntries(typedEntry.fields.relatedTreatments)
      : Promise.resolve([]),
  ]);

  return (
    <PatientEducationPage
      entry={typedEntry}
      relatedConditions={relatedConditions}
      relatedTreatments={relatedTreatments}
    />
  );
}
