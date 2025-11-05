import { useEffect, useRef, useState } from "react";
import type {
  GroupDragHandlerProps,
  PipePoint,
  Pipes,
  SelectedComponent,
  WaterMeter,
  WaterSupply,
} from "../types/map";
import * as d3 from "d3";

interface PanelPos {
  x: number;
  y: number;
}

export type Dimensions = {
  width: number;
  height: number;
};

interface DragHandlers {
  panelPos: PanelPos;
  setPanelPos: React.Dispatch<React.SetStateAction<PanelPos>>;
  isDragging: boolean;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
  dragOffset: React.MutableRefObject<PanelPos>;
}

// Panel drag start
export const handleMouseDown = (
  e: React.MouseEvent<HTMLDivElement>,
  panelPos: PanelPos,
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>,
  dragOffset: React.MutableRefObject<PanelPos>,
  dimensions: { width: number; height: number }
) => {
  setIsDragging(true);
  dragOffset.current = {
    x: e.clientX - (panelPos.x / 100) * dimensions.width,
    y: e.clientY - (panelPos.y / 100) * dimensions.height,
  };
};

// Panel dragging
export const handleMouseMove = ({
  e,
  isDragging,
  setPanelPos,
  dragOffset,
  dimensions,
}: {
  e: MouseEvent;
  isDragging: boolean;
  setPanelPos: React.Dispatch<React.SetStateAction<PanelPos>>;
  dragOffset: React.MutableRefObject<PanelPos>;
  dimensions: { width: number; height: number };
}) => {
  if (!isDragging) return;

  const xPercent =
    ((e.clientX - dragOffset.current.x) / dimensions.width) * 100;
  const yPercent =
    ((e.clientY - dragOffset.current.y) / dimensions.height) * 100;

  setPanelPos({
    x: xPercent,
    y: yPercent,
  });
};

// Drag end
export const handleMouseUp = (
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setIsDragging(false);
};

/* Handle Grid Lines */
export function drawGrid(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  dimensions: Dimensions,
  isModify?: boolean
) {
  const { width: w, height: h } = dimensions;

  const gridGroup = svg.select(".grid-layer");
  gridGroup.selectAll("*").remove(); // clear old grid

  const mainGridLineWidth = isModify ? 1 : 0.7;
  const mainGridLineColor = `#cccccc3f`; //isModify ? `#ccc` : `#cccccc3f`;
  const subGridLineColor = `#e9e9e955`; //isModify ? `#e9e9e9` : `#e9e9e955`;

  // Subgrid (1% intervals, skip 10%)
  for (let i = 1; i <= 100; i += 1) {
    const x = (i / 100) * w;
    const y = (i / 100) * h;

    if (i % 10 !== 0) {
      gridGroup
        .append("line")
        .attr("x1", x)
        .attr("y1", 0)
        .attr("x2", x)
        .attr("y2", h)
        .attr("stroke", `${subGridLineColor}`)
        .attr("stroke-width", 0.5);

      gridGroup
        .append("line")
        .attr("x1", 0)
        .attr("y1", y)
        .attr("x2", w)
        .attr("y2", y)
        .attr("stroke", `${subGridLineColor}`)
        .attr("stroke-width", 0.5);
    }
  }

  // Main grid (10% intervals)
  for (let i = 10; i <= 100; i += 10) {
    const x = (i / 100) * w;
    const y = (i / 100) * h;

    gridGroup
      .append("line")
      .attr("x1", x)
      .attr("y1", 0)
      .attr("x2", x)
      .attr("y2", h)
      .attr("stroke", `${mainGridLineColor}`)
      .attr("stroke-width", mainGridLineWidth);

    gridGroup
      .append("line")
      .attr("x1", 0)
      .attr("y1", y)
      .attr("x2", w)
      .attr("y2", y)
      .attr("stroke", `${mainGridLineColor}`)
      .attr("stroke-width", mainGridLineWidth);

    if (isModify) {
      gridGroup
        .append("text")
        .attr("x", x + 2)
        .attr("y", 12)
        .text(`${i}%`)
        .attr("font-size", 10)
        .attr("fill", "#999");

      gridGroup
        .append("text")
        .attr("x", 2)
        .attr("y", y - 2)
        .text(`${i}%`)
        .attr("font-size", 10)
        .attr("fill", "#999");
    }
  }
}

export const createDragHandlers = <
  ElementType extends SVGElement,
  T extends { id: string; type?: string },
>(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  getPosition: (item: T) => { x: number; y: number },
  updatePosition: (item: T, x: number, y: number) => T,
  setItem: (id: string, updated: T) => void,
  svgWidth: number,
  svgHeight: number
) => {
  return d3
    .drag<ElementType, T>()
    .on("start", (event, d) => {
      d3.select(event.sourceEvent.target).style("opacity", 0.6);
    })
    .on("drag", (event, d) => {
      const node = svg.node();
      if (!node) return;

      const transform = d3.zoomTransform(node);
      const [xPx, yPx] = transform.invert(d3.pointer(event, node));

      const x = (xPx / svgWidth) * 100;
      const y = (yPx / svgHeight) * 100;

      // special handling if type is pipe
      let updated: T;

      updated = updatePosition(d, x, y);

      setItem(d.id, updated);
      // Keep opacity at 0.6 during drag
      //d3.select(event.sourceEvent.target).style("opacity", 0.6);
    })
    .on("end", (event) => {
      //d3.select(event.sourceEvent.target).style("opacity", 0.6);
    });
};

/* export const GroupDragHandler = <T extends Pipes>({
  svg,
  selectedComponents,
  pipes,
  setPipes,
  svgWidth,
  svgHeight,
}: GroupDragHandlerProps<T>) => {
  const g = svg.select(".zoom-layer");

  selectedComponents.forEach((selected) => {
    if (selected.type !== "pipe") return;

    // Find the pipe object from main pipes array
    const pipe = pipes.find((p) => p.id === selected.data.id);
    if (!pipe) return;

    const pipeGroup = g.select(`.pipe-group-${pipe.id}`) as d3.Selection<
      SVGGElement,
      unknown,
      null,
      undefined
    >;

    //console.log(`pipeGroup`, pipeGroup);

    pipeGroup.call(
      d3
        .drag<SVGGElement, unknown>()
        .on("start", (event) => {
          event.sourceEvent.stopPropagation();

          // Save starting points for this drag
          (event.subject as any).startPoints = pipe.points.map((p) => ({
            ...p,
          }));
        })
        .on("drag", (event) => {
          const node = svg.node();
          if (!node) return;

          //console.log(`node list`, node);

          const transform = d3.zoomTransform(node);
          //console.log(`transform`, transform);

          // Add pixel delta to each point
          const updatedPoints = pipe.points.map((p) => ({
            ...p,
            x: p.x + (event.dx / svgWidth) * 100, // if you store % coords
            y: p.y + (event.dy / svgHeight) * 100,
          }));

          setPipes(pipe.id, { ...pipe, points: updatedPoints });
        })
        .on("end", () => {
          // optional cleanup
        })
    );
  });
}; */

export function toggleSelection(
  data: WaterSupply | WaterMeter | Pipes | PipePoint,
  type: SelectedComponent["type"],
  setSelectedComponents: React.Dispatch<
    React.SetStateAction<SelectedComponent[]>
  >,
  allowMultiSelect: boolean = true
) {
  setSelectedComponents((prev) => {
    const exists = prev.some(
      (item) => item.data.id === data.id && item.type === type
    );

    if (exists) {
      return prev.filter(
        (item) => !(item.data.id === data.id && item.type === type)
      );
    }

    if (!allowMultiSelect) {
      return [{ data, type }]; // Only 1 active selection
    }

    return [...prev, { data, type }];
  });
}
