import {fetchBynderAssetById, findMediaByExactNameAndMetaProperty, uploadToBynder} from "@/lib/bynder-service";

export const uploadPdfToBynder = async (pdfBuffer: Buffer, fileName: string, entityId: string) => {
  try {
    const metaProperties = {
      PatientName: entityId,
      assettype: 'documents',
      FileExtension: 'pdf',
      Organization: 'ChildrensHealth',
    };

    // Find exact match
    let asset = await findMediaByExactNameAndMetaProperty({
      name: fileName,
      metaProperties,
    });

    const mediaId = asset?.id;

    // Prepare data for Bynder upload
    const data = {
      entityId,
      stream: pdfBuffer,
      name: fileName,
      origName: fileName,
      ...(mediaId ? { mediaId } : {}),
    };

    // Upload to Bynder
    const uploadResult = await uploadToBynder(data);

    if (!asset) {
      asset = await fetchBynderAssetById(uploadResult?.mediaid);
    }

    return {
      success: true,
      asset,
    };

  } catch (error) {
    console.error(`❌ Upload failed: ${error.message}`);
    return {
      success: false,
      error: error.message,
      asset: null
    };
  }
}
