/**
 * Error originated from a request to S3 API.
 */
export class S3Error extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'S3Error';
  }
}
