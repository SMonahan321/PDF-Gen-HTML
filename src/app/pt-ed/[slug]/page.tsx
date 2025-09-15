import { notFound } from "next/navigation";
import { fetchPatientEducationBySlug } from "@/lib/contentful";
import { format } from "date-fns";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import type { Document } from "@contentful/rich-text-types";

type PageProps = {
  params: { slug: string };
};

export async function generateStaticParams() {
  return [] as { slug: string }[];
}

export default async function PatientEducationPage({ params }: PageProps) {
  const awaitedParams = await params;
  const { slug } = awaitedParams;

  const entry = await fetchPatientEducationBySlug({ slug });
  if (!entry) return notFound();

  const fields = entry.fields as {
    title?: string;
    subtitle?: string;
    body?: Document | undefined;
  };

  const updatedAt = entry.sys.updatedAt
    ? format(new Date(entry.sys.updatedAt), "PPP p")
    : "";

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <article className="prose prose-slate dark:prose-invert">
        {fields.title && (
          <h1 className="mb-2 text-3xl font-bold tracking-tight">{fields.title}</h1>
        )}
        {fields.subtitle && (
          <p className="mt-0 text-lg text-slate-600">{fields.subtitle}</p>
        )}

        <div className="mt-8">
          {fields.body ? (
            <div>{documentToReactComponents(fields.body)}</div>
          ) : (
            <p>No content available.</p>
          )}
        </div>

        {updatedAt && (
          <p className="mt-4 text-sm text-slate-500">Last updated: {updatedAt}</p>
        )}

      </article>
    </main>
  );
}


