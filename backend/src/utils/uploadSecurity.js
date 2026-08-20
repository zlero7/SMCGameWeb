export const BLOCKED_EXT = /\.(exe|bat|cmd|sh|ps1|vbs|jar|app|msi|dll|php|py|rb|pl)$/i

export function blockExecutableFiles(req, file, cb) {
  if (BLOCKED_EXT.test(file.originalname)) {
    return cb(new Error('실행 파일은 업로드할 수 없습니다'))
  }
  cb(null, true)
}
