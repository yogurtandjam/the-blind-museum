type ArtParams = {
  objectID: string;
  title?: string;
  artistDisplayName?: string;
  medium?: string;
  department?: string;
  classification?: string;
  dimensions?: string;
  creditLine: string;
  objectDate: string;
  primaryImage: string;
  primaryImageSmall: string;
};

export class Art {
  objectID: string;
  title: string;
  artistDisplayName: string;
  medium: string;
  department: string;
  classification: string;
  dimensions: string;
  creditLine: string;
  objectDate: string;
  primaryImage: string;
  primaryImageSmall: string;

  constructor({
    objectID,
    title,
    artistDisplayName,
    medium,
    department,
    classification,
    dimensions,
    creditLine,
    objectDate,
    primaryImage,
    primaryImageSmall,
  }: ArtParams) {
    this.objectID = objectID;
    this.title = title || "Untitled";
    this.artistDisplayName = artistDisplayName || "Unknown Artist";
    this.medium = medium || "";
    this.department = department || "";
    this.classification = classification || "";
    this.dimensions = dimensions || "";
    this.creditLine = creditLine;
    this.objectDate = objectDate;
    this.primaryImage = primaryImage;
    this.primaryImageSmall = primaryImageSmall;
  }

  get narrationText(): string {
    let text = this.title;

    if (this.artistDisplayName !== "Unknown Artist") {
      text += `, by ${this.artistDisplayName}`;
    }

    if (this.objectDate) {
      text += `, ${this.objectDate}`;
    }

    text += ".";

    if (this.medium) {
      text += ` ${this.medium}.`;
    }

    return text;
  }
}
