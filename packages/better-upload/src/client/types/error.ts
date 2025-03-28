import type { ClientUploadFilesError } from './public';

export class UploadFilesError extends Error {
  type: ClientUploadFilesError['type'];
  objectKeys?: string[];

  constructor({
    type,
    message,
    objectKeys,
  }: {
    type: ClientUploadFilesError['type'];
    message: string;
    objectKeys?: string[];
  }) {
    super(message);
    this.type = type;
    this.message = message;
    this.objectKeys = objectKeys;
  }
}
