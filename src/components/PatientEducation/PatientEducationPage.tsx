import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { format } from "date-fns";
import type {
  ConditionEntry,
  PatientEducationEntry,
  TreatmentEntry,
} from "@/lib/types";

interface PatientEducationPageProps {
  entry: PatientEducationEntry;
  relatedConditions: ConditionEntry[];
  relatedTreatments: TreatmentEntry[];
}

export default function PatientEducationPage({
  entry,
  relatedConditions,
  relatedTreatments,
}: PatientEducationPageProps) {
  const fields = entry.fields;
  const updatedAt = entry.sys.updatedAt
    ? format(new Date(entry.sys.updatedAt), "PPP p")
    : "";

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <article className="prose prose-slate dark:prose-invert">
        {/* Title Section */}
        {fields.title && (
          <header className="mb-8">
            <h1 className="mb-2 text-3xl font-bold tracking-tight">
              {fields.title}
            </h1>
            {fields.subtitle && (
              <p className="text-lg text-slate-600">{fields.subtitle}</p>
            )}
          </header>
        )}

        {/* Summary */}
        {fields.summary && (
          <div className="mb-6 p-4 bg-slate-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Summary</h2>
            <p className="text-slate-700">{fields.summary}</p>
          </div>
        )}

        {/* Document Info */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {fields.peidNumber && (
            <div>
              <span className="font-semibold">PEID Number:</span>{" "}
              {fields.peidNumber}
            </div>
          )}
          {fields.author && (
            <div>
              <span className="font-semibold">Author:</span> {fields.author}
            </div>
          )}
          {fields.publishDate && (
            <div>
              <span className="font-semibold">Published:</span>{" "}
              {fields.publishDate}
            </div>
          )}
          {fields.documentBrandRef && (
            <div>
              <span className="font-semibold">Document Brand:</span>{" "}
              {fields.documentBrandRef.fields?.title}
            </div>
          )}
        </div>

        {/* Main Image */}
        {fields.mainImage?.fields?.image?.[0]?.original && (
          <div className="mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fields.mainImage.fields.image[0].original}
              alt={
                fields.mainImage.fields.image[0].name ||
                fields.title ||
                "Patient education image"
              }
              className="w-full h-auto rounded-lg shadow-md"
            />
          </div>
        )}

        {/* Main Content Area */}
        {fields.mainContentArea && fields.mainContentArea.length > 0 && (
          <div className="mb-8">
            {fields.mainContentArea.map((content) => (
              <section key={content.sys.id} className="mb-6">
                {content.fields?.heading && (
                  <h2 className="text-xl font-semibold mb-3">
                    {content.fields.heading}
                  </h2>
                )}
                {content.fields?.body && (
                  <div className="prose prose-slate">
                    {documentToReactComponents(content.fields.body)}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}

        {/* Related Conditions */}
        {relatedConditions.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Related Conditions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {relatedConditions.map((condition) => (
                <div
                  key={condition.sys.id}
                  className="p-3 bg-blue-50 rounded-lg"
                >
                  <span className="font-medium">
                    {condition.fields?.conditionName}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related Treatments */}
        {relatedTreatments.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Related Treatments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {relatedTreatments.map((treatment) => (
                <div
                  key={treatment.sys.id}
                  className="p-3 bg-green-50 rounded-lg"
                >
                  <span className="font-medium">
                    {treatment.fields?.treatmentName}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Main Body Content */}
        <div className="mt-8">
          {fields.body ? (
            <div className="prose prose-slate max-w-none">
              {documentToReactComponents(fields.body)}
            </div>
          ) : (
            <p className="text-slate-500 italic">
              No additional content available.
            </p>
          )}
        </div>

        {/* Footer */}
        {updatedAt && (
          <footer className="mt-8 pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-500">Last updated: {updatedAt}</p>
          </footer>
        )}
      </article>
    </main>
  );
}
