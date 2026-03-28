import { Art } from "./Art";

export type Wing = {
  departmentId: number;
  displayName: string;
  artworks: Art[];
  objectIds: number[];
  loadingState: "idle" | "loading" | "loaded";
};
