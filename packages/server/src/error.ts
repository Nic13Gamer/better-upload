export class RejectUpload extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RejectUpload';
  }
}
