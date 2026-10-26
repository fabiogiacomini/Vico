import { MAX_GPX_BYTES } from '../core/gpx';
export async function pickGpx(): Promise<{ xml: string; name: string } | undefined> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.gpx,application/gpx+xml';
    input.addEventListener('cancel', () => resolve(undefined), { once: true });
    input.onchange = async () => {
      try {
        const file = input.files?.[0]; if (!file) return resolve(undefined);
        if (!/\.gpx$/i.test(file.name)) throw new Error('Choose a .gpx file.');
        if (file.size > MAX_GPX_BYTES) throw new Error('Choose a GPX smaller than 2 MB.');
        resolve({ xml: await file.text(), name: file.name });
      } catch (error) { reject(error); }
    };
    input.click();
  });
}
