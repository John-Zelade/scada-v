import type { SelectedComponent } from "./map";

export interface ResizeHandleOptions {
  svgGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  posX: number;
  posY: number;
  width: number;
  height: number;
  selectedComponents: SelectedComponent[];
  elementId: string;
  elementType:
    | "water-supply"
    | "water-tanks"
    | "water-pressure"
    | "water-meters"
    | "pipe"
    | "circle"
    | "connection-point";
  handleSize?: number;
  className?: string;
  borderColor?: string;
  borderWidth?: number;
}
