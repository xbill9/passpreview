
import JSZip from 'jszip';
import type { PassData, PassStructure, PassField, PassImage, PassColors, PkpassParserResult, PassBarcode } from '@/interfaces/pass-data';

const imageKeys = ['icon', 'logo', 'background', 'footer', 'strip', 'thumbnail'] as const;
type ImageKey = typeof imageKeys[number];

const passTypeKeys = ['boardingPass', 'coupon', 'eventTicket', 'generic', 'storeCard'] as const;
type PassTypeKey = typeof passTypeKeys[number];


async function extractImage(zip: JSZip, baseName: ImageKey): Promise<PassImage | undefined> {
  const resolutions = ['@3x', '@2x', ''];
  let imageFile: JSZip.JSZipObject | null = null;
  let fileName = '';

  for (const res of resolutions) {
    fileName = `${baseName}${res}.png`;
    imageFile = zip.file(fileName);
    if (imageFile) break;
  }

  if (imageFile) {
    try {
      const blob = await imageFile.async('blob');
      const url = URL.createObjectURL(blob);
      return { url, alt: `${baseName.charAt(0).toUpperCase() + baseName.slice(1)} image` };
    } catch (e) {
      console.error(`Error processing image ${fileName}:`, e);
      return undefined;
    }
  }
  return undefined;
}


export async function parsePkpassFile(file: File): Promise<PkpassParserResult> {
  if (!file.name.endsWith('.pkpass') && file.type !== 'application/vnd.apple.pkpass') {
    return { success: false, error: 'Invalid file type. Please upload a .pkpass file.' };
  }

  try {
    const zip = new JSZip();
    const content = await file.arrayBuffer();
    await zip.loadAsync(content);

    const passJsonFile = zip.file('pass.json');
    if (!passJsonFile) {
      return { success: false, error: 'Invalid .pkpass file: pass.json not found.' };
    }

    const passJsonString = await passJsonFile.async('string');
    const passJson = JSON.parse(passJsonString) as any; // Consider more specific typing if needed

    let effectivePassStructure: PassStructure = {};
    let passType: PassTypeKey | undefined = undefined;

    for (const key of passTypeKeys) {
      if (passJson[key]) {
        effectivePassStructure = passJson[key] as PassStructure;
        passType = key;
        break;
      }
    }
    
    if (!passType) {
        // Fallback to trying to find fields directly if no top-level pass type key is found
        // This is not standard but might handle some malformed passes.
        const primaryFields = passJson.primaryFields as PassField[] | undefined;
        const secondaryFields = passJson.secondaryFields as PassField[] | undefined;
        const auxiliaryFields = passJson.auxiliaryFields as PassField[] | undefined;
        const headerFields = passJson.headerFields as PassField[] | undefined;
        const backFields = passJson.backFields as PassField[] | undefined;

        if (primaryFields || secondaryFields || auxiliaryFields || headerFields || backFields) {
            effectivePassStructure = {
                primaryFields,
                secondaryFields,
                auxiliaryFields,
                headerFields,
                backFields,
            };
        } else {
            return { success: false, error: 'No recognizable pass structure (e.g., eventTicket, generic) found in pass.json.' };
        }
    }


    const effectiveImages: Partial<Record<ImageKey, PassImage>> = {};
    for (const key of imageKeys) {
      const img = await extractImage(zip, key);
      if (img) {
        effectiveImages[key] = img;
      }
    }
    
    const effectiveColors: PassColors = {
      backgroundColor: passJson.backgroundColor,
      foregroundColor: passJson.foregroundColor,
      labelColor: passJson.labelColor,
      stripColor: passJson.stripColor,
    };

    const barcode = passJson.barcode as PassBarcode | undefined;
    const barcodes = passJson.barcodes as PassBarcode[] | undefined;

    const passData: PassData = {
      formatVersion: passJson.formatVersion,
      passTypeIdentifier: passJson.passTypeIdentifier,
      serialNumber: passJson.serialNumber,
      teamIdentifier: passJson.teamIdentifier,
      webServiceURL: passJson.webServiceURL,
      authenticationToken: passJson.authenticationToken,
      organizationName: passJson.organizationName,
      description: passJson.description,
      logoText: passJson.logoText,
      
      // Store the specific pass type structure if available
      ...(passType && passJson[passType] ? { [passType]: passJson[passType] } : {}),

      barcode: barcode,
      barcodes: barcodes,
      
      effectivePassStructure,
      effectiveColors,
      effectiveImages: effectiveImages as PassData['effectiveImages'], // Cast as some images might be undefined
    };

    return { success: true, data: passData };

  } catch (e) {
    console.error("Error parsing .pkpass file:", e);
    if (e instanceof SyntaxError) {
      return { success: false, error: 'Error parsing pass.json: Invalid JSON format.' };
    }
    return { success: false, error: 'Could not parse .pkpass file. It might be corrupted or not a valid pass.' };
  }
}
