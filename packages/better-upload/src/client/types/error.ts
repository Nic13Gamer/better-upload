import type { ClientUploadFileError } from './public';

export class UploadFilesError extends Error {
  type: ClientUploadFileError['type'];

  constructor({
    type,
    message,
  }: {
    type: ClientUploadFileError['type'];
    message: string;
  }) {
    super(message);
    this.type = type;
    this.message = message;
  }
}
