export type Dimensions = {
  width: number;
  height: number;
};

export interface WaterMeter {
  x: number; // percent
  y: number; // percent
  id: string;
}

export interface WaterSupply {
  x: number; // percent
  y: number; // percent
  id: string;
}
