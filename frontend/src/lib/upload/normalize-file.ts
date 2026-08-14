// Normalize a `File` so the browser-reported MIME type matches the
// file's actual extension.
//
// Why: Laravel's `mimes:xlsx,xls` validation can fail on otherwise
// correct files when the browser reports a generic type
// (`application/octet-stream` or an empty string — common on Windows
// when the file association isn't recognized). The validation rule
// checks `getMimeType()` first and only falls back to sniffing the
// file's bytes; if the multipart `Content-Type` of the file part is
// generic, Laravel often rejects the upload even though the content
// is a perfectly valid xlsx.
//
// The fix is conservative: only override the MIME type when the
// reported one is generic. If the browser already sent a specific,
// correct type we leave it alone.

const GENERIC_MIME_TYPES = new Set([
  "",
  "application/octet-stream",
  "application/x-zip-compressed",
  "binary/octet-stream",
]);

const EXTENSION_TO_MIME: Record<string, string> = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  csv: "text/csv",
};

/**
 * Returns a `File` whose MIME type matches its filename extension.
 * If the browser already reported a specific (non-generic) type,
 * the original file is returned unchanged.
 */
export function prepareFileForUpload(file: File): File {
  const dot = file.name.lastIndexOf(".");
  if (dot === -1 || dot === file.name.length - 1) return file;
  const ext = file.name.slice(dot + 1).toLowerCase();
  const canonical = EXTENSION_TO_MIME[ext];
  if (!canonical) return file;
  if (!GENERIC_MIME_TYPES.has(file.type)) return file;
  if (file.type === canonical) return file;
  return new File([file], file.name, { type: canonical, lastModified: file.lastModified });
}
