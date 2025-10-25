export type Dimensions = {
  width: number;
  height: number;
};

export interface PipePoint {
  x: number;
  y: number;
}

export type PipePointDatum = {
  id: string;
  point: { x: number; y: number; linkedMeterId?: string };
};

export interface Pipes {
  id: string;
  points: { x: number; y: number }[];
}

export interface WaterMeter {
  id: string;
  points: { x: number; y: number }[];
}

export interface WaterSupply {
  id: string;
  points: { x: number; y: number }[];
}

export type SelectedComponent = {
  id: string;
  type: "water-supply" | "water-meter" | "pipe"; // extend if more types later
};
