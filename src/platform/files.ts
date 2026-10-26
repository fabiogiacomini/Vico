import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { MAX_GPX_BYTES } from '../core/gpx';
export async function pickGpx(): Promise<{ xml: string; name: string } | undefined> {
  const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true, multiple: false });
  if (result.canceled) return;
  const asset = result.assets[0], file = new File(asset.uri);
  try {
    if (!/\.gpx$/i.test(asset.name)) throw new Error('Choose a .gpx file.');
    if ((asset.size ?? file.size) > MAX_GPX_BYTES) throw new Error('Choose a GPX smaller than 2 MB.');
    return { xml: await file.text(), name: asset.name };
  } finally { if (file.exists) file.delete(); }
}
