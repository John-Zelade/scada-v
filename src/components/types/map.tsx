export type Dimensions = {
  width: number;
  height: number;
};

export interface GroupDragHandlerProps<T> {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  selectedComponents: SelectedComponent[];
  pipes: Pipes[];
  setPipes: (id: string, updated: Pipes) => void;
  svgWidth: number;
  svgHeight: number;
}

export interface PipePoint {
  id: string;
  x: number;
  y: number;
}

export type PipePointDatum = {
  id: string;
  point: { x: number; y: number; linkedMeterId?: string };
};

export interface Pipes {
  id: string;
  points: { id: string; x: number; y: number }[];
}

export interface WaterMeter {
  id: string;
  points: { x: number; y: number }[];
}

export interface WaterSupply {
  id: string;
  points: { x: number; y: number }[];
}

export interface Shape {
  id: string;
  points: { x: number; y: number }[];
}

export type Point = {
  id: string;
  x: number;
  y: number;
};

export interface ShapeItem {
  id: string;
  points: Point[];
}

export interface ShapesType {
  circle: ShapeItem[];
  rect: ShapeItem[];
  line: ShapeItem[];
  pipe: Pipes[];
  valve: ShapeItem[];
  pump: ShapeItem[];
  tank: ShapeItem[];
  sensor: ShapeItem[];
  text: ShapeItem[];
}

export type SelectedComponent = {
  data: WaterSupply | WaterMeter | Pipes | PipePoint | ShapeItem;
  type: "water-supply" | "water-meter" | "pipe" | "circle" | "connection-point"; // extend if more types later
};
