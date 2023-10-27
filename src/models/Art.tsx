type ArtParams = {
  objectID: string;
  creditLine: string;
  objectDate: string;
  primaryImage: string;
  primaryImageSmall: string;
};

export class Art {
  objectID: string;
  creditLine: string;
  objectDate: string;
  primaryImage: string;
  primaryImageSmall: string;

  constructor({
    objectID,
    creditLine,
    objectDate,
    primaryImage,
    primaryImageSmall,
  }: ArtParams) {
    this.objectID = objectID;
    this.creditLine = creditLine;
    this.objectDate = objectDate;
    this.primaryImage = primaryImage;
    this.primaryImageSmall = primaryImageSmall;
  }
}
