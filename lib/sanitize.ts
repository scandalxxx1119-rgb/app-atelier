/**
 * http/https以外のスキーム（javascript:等）を除外する
 */
export function safeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return url;
    }
    return null;
  } catch {
    return null;
  }
}

/** 画像ファイルのサイズを検証する（デフォルト10MB） */
export function validateImageFile(file: File, maxMB = 10): string | null {
  const maxBytes = maxMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return `ファイルサイズは${maxMB}MB以下にしてください（現在: ${(file.size / 1024 / 1024).toFixed(1)}MB）`;
  }
  return null;
}
