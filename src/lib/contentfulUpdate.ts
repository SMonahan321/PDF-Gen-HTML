import { getManagementClient } from './contentful';

export interface PatientEducationPDFInfo {
  fileName: string;
  filePath: string;
  url: string;
  fileSize: number;
  generatedAt: string;
}

export interface PatientEducationUpdateOptions {
  entryId: string;
  spaceId: string;
  environment?: string;
  pdfInfo: PatientEducationPDFInfo;
}

export interface ContentfulUpdateResult {
  success: boolean;
  entry?: any;
  error?: string;
}

/**
 * Updates a Patient Education entry with PDF information
 * This function is specifically designed for patientEducation content type
 */
export async function updatePatientEducationEntry(options: PatientEducationUpdateOptions): Promise<ContentfulUpdateResult> {
  const { 
    entryId, 
    spaceId, 
    environment = 'master',
    pdfInfo
  } = options;

  try {
    console.log(`Updating Patient Education entry: ${entryId} in space: ${spaceId}`);

    // Get Contentful Management API client
    const client = getManagementClient();

    // Get the space
    const space = await client.getSpace(spaceId);
    
    // Get the environment
    const env = await space.getEnvironment(environment);
    
    // Get the entry
    const entry = await env.getEntry(entryId);
    
    // Verify this is a patientEducation content type
    if (entry.sys.contentType.sys.id !== 'patientEducation') {
      throw new Error(`Entry ${entryId} is not a patientEducation content type. Found: ${entry.sys.contentType.sys.id}`);
    }
    
    // Prepare update data for patientEducation content type
    const updateData: any = {
      sys: {
        type: 'Entry',
        id: entryId,
        version: entry.sys.version + 1, // Increment version for update
      },
      fields: { ...entry.fields }
    };

    // Add PDF information to patientEducation fields
    updateData.fields.pdfUrl = {
      'en-US': pdfInfo.url
    };

    updateData.fields.pdfFileName = {
      'en-US': pdfInfo.fileName
    };

    updateData.fields.pdfFilePath = {
      'en-US': pdfInfo.filePath || 'Generated as stream'
    };

    updateData.fields.pdfGeneratedAt = {
      'en-US': pdfInfo.generatedAt
    };

    updateData.fields.pdfFileSize = {
      'en-US': pdfInfo.fileSize
    };

    // Update the entry
    const updatedEntry = await entry.update(updateData);
    
    // Publish the entry (optional - uncomment if you want to auto-publish)
    // await updatedEntry.publish();

    console.log(`Patient Education entry updated successfully: ${entryId}`);

    return {
      success: true,
      entry: updatedEntry
    };

  } catch (error) {
    console.error(`Failed to update Patient Education entry ${entryId}:`, error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Updates Patient Education entry with complete PDF information
 */
export async function updatePatientEducationWithPDFInfo(
  entryId: string,
  spaceId: string,
  pdfInfo: {
    fileName: string;
    filePath: string;
    url: string;
    fileSize: number;
  },
  environment: string = 'master'
): Promise<ContentfulUpdateResult> {
  return updatePatientEducationEntry({
    entryId,
    spaceId,
    environment,
    pdfInfo: {
      ...pdfInfo,
      generatedAt: new Date().toISOString()
    }
  });
}

/**
 * Extracts space ID from Contentful URN
 */
export function extractSpaceIdFromUrn(urn: string): string | null {
  try {
    const parts = urn.split('/');
    if (parts.length >= 2 && parts[0] === 'urn:contentful') {
      return parts[1];
    }
    return null;
  } catch (error) {
    console.error('Failed to extract space ID from URN:', error);
    return null;
  }
}
