export function isFileTypeAllowed(
  fileType: string,
  allowedFileTypes: string[]
) {
  let invalid = true;

  allowedFileTypes.forEach((type) => {
    if (type.endsWith('/*')) {
      const prefix = type.split('/*')[0];
      if (prefix && fileType.startsWith(prefix)) {
        invalid = false;
      }
    } else if (type === fileType) {
      invalid = false;
    }
  });

  return !invalid;
}
