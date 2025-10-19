import { useEffect, useRef, useState } from "react";
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
  dimensions: Dimensions
) {
  const { width: w, height: h } = dimensions;

  // Remove previous grid
  svg.selectAll(".grid-lines").remove();

  const gridGroup = svg.append("g").attr("class", "grid-lines");

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
        .attr("stroke", "#e9e9e9")
        .attr("stroke-width", 0.5);

      gridGroup
        .append("line")
        .attr("x1", 0)
        .attr("y1", y)
        .attr("x2", w)
        .attr("y2", y)
        .attr("stroke", "#e9e9e9")
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
      .attr("stroke", "#ccc")
      .attr("stroke-width", 1);

    gridGroup
      .append("line")
      .attr("x1", 0)
      .attr("y1", y)
      .attr("x2", w)
      .attr("y2", y)
      .attr("stroke", "#ccc")
      .attr("stroke-width", 1);

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
