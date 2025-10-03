import type { Document } from "@contentful/rich-text-types";

export interface ContentfulAsset {
  sys: {
    id: string;
    type: string;
  };
  fields: {
    title: string;
    description?: string;
    image: any;
  };
}

export interface ContentfulEntry {
  sys: {
    id: string;
    type: string;
    createdAt: string;
    updatedAt: string;
    version: number;
    space: {
      sys: {
        id: string;
        type: string;
      };
    };
    environment: {
      sys: {
        id: string;
        type: string;
      };
    };
    contentType: {
      sys: {
        id: string;
        type: string;
      };
    };
  };
  fields: Record<string, any>;
}

export interface PatientEducationEntry extends ContentfulEntry {
  fields: {
    title?: string;
    subtitle?: string;
    summary?: string;
    slug?: string;
    peidNumber?: string;
    author?: string;
    publishDate?: string;
    documentBrandRef?: ContentfulEntry;
    mainImage?: ContentfulAsset;
    mainContentArea?: MainContentAreaEntry[];
    relatedConditions?: (ContentfulEntry | ResourceLink)[];
    relatedTreatments?: (ContentfulEntry | ResourceLink)[];
    body?: Document;
  };
}

export interface MainContentAreaEntry extends ContentfulEntry {
  fields: {
    heading?: string;
    body?: Document;
  };
}

export interface ResourceLink {
  sys: {
    type: 'ResourceLink';
    urn: string;
  };
}

export interface ConditionEntry extends ContentfulEntry {
  fields: {
    conditionName?: string;
  };
}

export interface TreatmentEntry extends ContentfulEntry {
  fields: {
    treatmentName?: string;
  };
}
