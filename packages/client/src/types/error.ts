import type { ClientUploadError } from './public';

export class ClientUploadErrorClass extends Error {
  type: ClientUploadError['type'];

  constructor({
    type,
    message,
  }: {
    type: ClientUploadError['type'];
    message: string;
  }) {
    super(message);
    this.type = type;
    this.message = message;
  }
}
