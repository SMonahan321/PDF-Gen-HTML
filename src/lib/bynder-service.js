import Bynder from "@bynder/bynder-js-sdk";

const bynder = new Bynder({
  baseURL: process.env.BYNDER_BASE_URL,
  permanentToken: process.env.BYNDER_PERMANENT_TOKEN,
});

/**
 * Fetches metadata properties from Bynder and maps them by name.
 * @returns {Object} - A map of metadata property names to their IDs.
 */
const fetchMetaProperties = async () => {
  const metaProperties = await bynder.getMetaproperties();
  const metaPropertyMap = {};
  metaProperties.forEach((prop) => {
    metaPropertyMap[prop.name] = prop.id;
  });
  return metaPropertyMap;
};

/**
 * Creates a metadata property object for Bynder.
 * @param {string} key - The metadata property key.
 * @param {string} value - The metadata property value.
 * @returns {Object} - The metadata property object.
 */
const createMetaProperty = (key, value) => ({ [`metaproperty.${key}`]: value });

/**
 * Uploads an image to Bynder.
 * @param {Object} data - The image data to upload.
 * @param {boolean} bypassContentMetaData - Whether to bypass content metadata.
 * @returns {Object} - The result of the upload operation.
 */
const uploadToBynder = async (data) => {
  const { stream, name, origName, mediaId, entityId } = data;
  const fileExtension = origName.split(".").pop();
  let assetType = "Photography";

  // Determine asset type based on file extension
  if (fileExtension.includes("pdf")) {
    assetType = "Documents";
  } else if (fileExtension.includes("mov") || fileExtension.includes("mp4")) {
    assetType = "Videos";
  } else if (fileExtension.includes("svg")) {
    assetType = "Graphics";
  }

  try {
    const metaPropertyMap = await fetchMetaProperties();

    const assetData = {
      filename: origName,
      body: stream,
      data: {
        ...(mediaId ? { mediaId } : {}),
        brandId: process.env.BYNDER_BRAND_ID,
        name,
        description: "",
        isPublic: true,
        ...createMetaProperty(metaPropertyMap.assetsubtype, "dotcom"),
        ...createMetaProperty(metaPropertyMap.PatientName, entityId),
        ...createMetaProperty(metaPropertyMap.assettype, assetType),
        ...createMetaProperty(metaPropertyMap.FileExtension, fileExtension),
        ...createMetaProperty(
          metaPropertyMap.Organization,
          "Children's Health",
        ),
      },
    };

    return await bynder.uploadFile(assetData);
  } catch (error) {
    console.error(`Error on uploadToBynder(): ${name}`, error.message);
    throw error;
  }
};

/**
 * Fetches a Bynder asset by its ID.
 * @param {string} mediaID - The ID of the asset to fetch.
 * @returns {Object} - The asset information.
 */
const fetchBynderAssetById = async (mediaID) => {
  try {
    return await bynder.getMediaInfo({ id: mediaID });
  } catch (error) {
    throw new Error(
      `Attempting to find Bynder asset ID [${mediaID}]: ${error.message}`,
    );
  }
};

/**
 * Searches for media in Bynder based on metaproperty and name.
 * @param {Object} searchParams - Search parameters
 * @param {string} searchParams.name - The name to search for (partial match supported)
 * @param {Object} searchParams.metaProperties - Metaproperties to filter by (e.g., { PatientName: 'entityId', assettype: 'Documents' })
 * @param {number} [searchParams.limit=100] - Maximum number of results to return
 * @param {number} [searchParams.page=1] - Page number for pagination
 * @returns {Promise<Array>} - Array of matching media assets
 *
 * @example
 * // Search for PDFs with a specific entity ID
 * const results = await searchMediaByMetaPropertyAndName({
 *   name: 'patient-education',
 *   metaProperties: {
 *     PatientName: 'abc123',
 *     assettype: 'Documents',
 *     FileExtension: 'pdf'
 *   },
 *   limit: 50
 * });
 */
const searchMediaByMetaPropertyAndName = async (searchParams) => {
  const { name, metaProperties = {}, limit = 100, page = 1 } = searchParams;

  // Build query parameters
  const queryParameters = {
    limit,
    page,
  };

  // Add name/keyword search if provided
  if (name) {
    queryParameters.keyword = name;
  }

  // Fetch metaproperty map to convert names to IDs
  const metaPropertyMap = await fetchMetaProperties();

  // Add metaproperty filters
  for (const [propName, propValue] of Object.entries(metaProperties)) {
    const metaPropertyId = metaPropertyMap[propName];

    if (!metaPropertyId) {
      continue;
    }

    // Bynder uses property_<metaPropertyId> format for filtering
    queryParameters[`property_${metaPropertyId}`] = propValue;
  }

  // Execute search
  const results = await bynder.getMediaList(queryParameters);

  return results;
};

/**
 * Finds a single media asset by exact name match and metaproperties.
 * @param {Object} searchParams - Search parameters
 * @param {string} searchParams.name - Exact name to match
 * @param {Object} searchParams.metaProperties - Metaproperties to filter by
 * @returns {Promise<Object|null>} - The matching asset or null if not found
 *
 * @example
 * // Find specific PDF by entity ID and exact name
 * const asset = await findMediaByExactNameAndMetaProperty({
 *   name: 'patient-education-slug-abc',
 *   metaProperties: {
 *     PatientName: 'abc123',
 *     assettype: 'Documents'
 *   }
 * });
 */
const findMediaByExactNameAndMetaProperty = async (searchParams) => {
  const { name, metaProperties = {} } = searchParams;

  if (!name) {
    throw new Error("Name parameter is required for exact match search");
  }

  // Use the search function to get candidates
  const results = await searchMediaByMetaPropertyAndName({
    name,
    metaProperties,
    limit: 100,
  });

  // Find exact name match
  const exactMatch = results.find((asset) => asset.name === name);

  if (exactMatch) {
    return exactMatch;
  } else {
    return null;
  }
};

export {
  uploadToBynder,
  fetchBynderAssetById,
  searchMediaByMetaPropertyAndName,
  findMediaByExactNameAndMetaProperty,
  fetchMetaProperties,
};
