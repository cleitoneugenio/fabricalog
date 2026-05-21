import { Capacitor } from '@capacitor/core';

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function saveFile(blob, fileName, { silent = false } = {}) {
  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');

    const base64 = await blobToBase64(blob);

    if (silent) {
      // Salva direto em Documents sem abrir nenhum dialog
      await Filesystem.writeFile({
        path: `FabricaLog/${fileName}`,
        data: base64,
        directory: Directory.Documents,
        recursive: true,
      });
      return;
    }

    const { Share } = await import('@capacitor/share');
    const { uri } = await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: Directory.Cache,
    });
    await Share.share({ title: fileName, url: uri });
    return;
  }

  // No desktop sempre faz download direto — share API só no mobile
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const file = new File([blob], fileName, { type: blob.type });
  if (!silent && isMobile && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: fileName });
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
