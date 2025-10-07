import { getManagementClient } from "@/lib/contentful-cma";

/**
 * Updates a Patient Education entry with PDF information
 * This function is specifically designed for patientEducation content type
 */
export async function updatePatientEducationEntry(options) {
  const { entryId, spaceId, environment = "master", asset } = options;

  try {
    console.log(
      `Updating Patient Education entry: ${entryId} in space: ${spaceId}`,
    );

    // Get Contentful Management API client
    const client = getManagementClient();

    console.log(11, spaceId);

    // Get the space
    const space = await client.getSpace(spaceId);

    // Get the environment
    const env = await space.getEnvironment(environment);

    // Get the entry
    const entry = await env.getEntry(entryId);

    // Verify this is a patientEducation content type
    if (entry.sys.contentType.sys.id !== "patientEducation") {
      throw new Error(
        `Entry ${entryId} is not a patientEducation content type. Found: ${entry.sys.contentType.sys.id}`,
      );
    }

    entry.fields.pdf = { "en-US": [asset] };

    // Update the entry
    const updatedEntry = await entry.update();
    // await updatedEntry.publish();

    console.log(`Patient Education entry updated successfully: ${entryId}`);

    return {
      success: true,
      entry: updatedEntry,
    };
  } catch (error) {
    console.error(
      `Failed to update Patient Education entry ${entryId}:`,
      error,
    );

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
