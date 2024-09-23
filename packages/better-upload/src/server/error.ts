export class UploadFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadFileError';
  }
}
