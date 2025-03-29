import type { ClientUploadFileError } from './public';

export class UploadFileError extends Error {
  type: ClientUploadFileError['type'];
  objectKey?: string;

  constructor({
    type,
    message,
    objectKey,
  }: {
    type: ClientUploadFileError['type'];
    message: string;
    objectKey?: string;
  }) {
    super(message);
    this.type = type;
    this.message = message;
    this.objectKey = objectKey;
  }
}
