import * as d3 from "d3";
import type { WaterMeter } from "../types/map";
export interface PipePointPercent {
  x: number;
  y: number;
}

// Each pipe will track its own animation frame
const pipeAnimationFrames: Record<string, number> = {};
const waterMeterAnimationFrames: Record<string, number> = {};

export function drawPipe(
  isModify: boolean,
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  pipePoints: PipePointPercent[],
  setPipePoints: (pipeId: string, points: PipePointPercent[]) => void,
  svgWidth: number,
  svgHeight: number,
  pipeId: string = "Default-Pipe",
  selectedPipe?: string | null,
  setSelectedPipe?: React.Dispatch<React.SetStateAction<string | null>>
) {
  svg.selectAll(`.pipe-group-${pipeId}`).remove();
  // Stop only this pipe's previous animation
  if (pipeAnimationFrames[pipeId])
    cancelAnimationFrame(pipeAnimationFrames[pipeId]);

  const pipeGroup = svg
    .append("g")
    .attr("class", `pipe-group pipe-group-${pipeId}`);

  const toPixel = (p: PipePointPercent) => ({
    x: (p.x / 100) * svgWidth,
    y: (p.y / 100) * svgHeight,
  });

  // Create polyline path
  const linePoints = pipePoints
    .map((p) => {
      const { x, y } = toPixel(p);
      return `${x},${y}`;
    })
    .join(" ");

  // --- Outer border layer (gray pipe border) ---
  pipeGroup
    .append("polyline")
    .attr("points", linePoints)
    .attr("stroke", "#575757") // metallic gray
    .attr("stroke-width", 7.5) // border thickness
    .attr("fill", "none")
    .attr("stroke-linejoin", !isModify ? "round" : "miter"); //Rounded corners when not modifying

  // --- Inner fill layer (blue water inside pipe) ---
  const polyline = pipeGroup
    .append("polyline")
    .attr("class", "pipe-inner")
    .attr("points", linePoints)
    .attr(
      "stroke",
      selectedPipe === pipeId && isModify ? "#8bc3fbff" : "#1e90ff"
    )
    .attr("stroke-width", selectedPipe === pipeId && isModify ? 7 : 6)
    .attr("fill", "none")
    .attr("stroke-linejoin", !isModify ? "round" : "miter") //Rounded corners when not modifying
    .style(`cursor`, `pointer`)
    .on("click", (event) => {
      event.stopPropagation(); // prevent deselect when clicking overlapping elements
      if (setSelectedPipe) {
        setSelectedPipe((prev) => (prev === pipeId ? null : pipeId));
      }
    });

  // --- Flow effect ---
  const totalLength = polyline.node()?.getTotalLength() || 0;
  const particleSpacing = 20;
  let offset = 0;
  const flowLength = Math.max(5, Math.floor(totalLength / particleSpacing));

  // Rectangular flow particles
  const flowRects = Array.from({ length: flowLength }).map(() =>
    pipeGroup
      .append("rect")
      .attr("width", 8)
      .attr("height", 3)
      .attr("fill", "#4ac4f8ff")
      .attr("rx", 1)
      .attr("ry", 1)
  );

  const animateFlow = () => {
    if (!polyline.node()) return;

    if (isModify) {
      flowRects.forEach((rect) => rect.attr("display", "none"));
      return;
    }

    offset = (offset + 1.5) % totalLength;

    flowRects.forEach((rect, i) => {
      const distance = (offset + i * particleSpacing) % totalLength;
      const point = polyline.node()!.getPointAtLength(distance);
      const nextPoint = polyline
        .node()!
        .getPointAtLength((distance + 1) % totalLength);
      const angle =
        Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) *
        (180 / Math.PI);

      rect
        .attr("x", point.x - 4)
        .attr("y", point.y - 1.5)
        .attr("transform", `rotate(${angle}, ${point.x}, ${point.y})`);
    });

    pipeAnimationFrames[pipeId] = requestAnimationFrame(animateFlow);
  };

  animateFlow();

  // --- Draggable points ---
  const drag = d3
    .drag<SVGRectElement, PipePointPercent>()
    .on("drag", (event, d) => {
      const svgNode = svg.node();
      if (!svgNode) return;

      // Get current zoom transform
      const transform = d3.zoomTransform(svgNode);

      // Adjust pointer by inverse of zoom transform
      const [xPx, yPx] = transform.invert(d3.pointer(event, svg.node()));

      const x = (xPx / svgWidth) * 100;
      const y = (yPx / svgHeight) * 100;

      const newPoints = pipePoints.map((p) => (p === d ? { x, y } : p));
      console.log(`newPoints`, newPoints);

      setPipePoints(pipeId, newPoints);
    });

  const size = 6;

  pipeGroup
    .selectAll<SVGRectElement, PipePointPercent>("rect.drag-handle")
    .data(pipePoints)
    .join("rect")
    .attr("class", "drag-handle")
    .attr("x", (d) => (d.x / 100) * svgWidth - size / 2)
    .attr("y", (d) => (d.y / 100) * svgHeight - size / 2)
    .attr("width", size)
    .attr("height", size)
    .attr("fill", "#fff")
    .attr("stroke", "#007bff")
    .attr("stroke-width", 1)
    .style("cursor", "pointer")
    .style("display", !isModify ? "none" : "block")
    .call(drag);
}

/*  Handle water meter */

export function drawWaterMeter(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  meters: WaterMeter[],
  setMeters: (id: string, meter: WaterMeter) => void,
  svgWidth: number,
  svgHeight: number,
  selectedMeter?: string | null,
  setSelectedMeter?: React.Dispatch<React.SetStateAction<string | null>>,
  isModify: boolean = false
) {
  // Remove existing meters
  svg.selectAll(".water-meter").remove();

  meters.forEach((meter) => {
    const meterGroup = svg
      .append("g")
      .attr("class", `water-meter meter-${meter.id}`);

    const cx = (meter.x / 100) * svgWidth;
    const cy = (meter.y / 100) * svgHeight;
    const radius = 20;

    const circle = meterGroup
      .append("circle")
      .datum(meter) // <-- bind the datum here
      .attr("cx", cx)
      .attr("cy", cy)
      .attr("r", radius)
      .attr(
        "fill",
        selectedMeter === meter.id && isModify ? "#8bc4fcff" : "#727272ff"
      )
      .attr("stroke", "#007bff")
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        if (setSelectedMeter) {
          setSelectedMeter((prev) => (prev === d.id ? null : d.id));
        }
      });

    // Meter label
    meterGroup
      .append("text")
      .attr("x", cx)
      .attr("y", cy - 25)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .attr("fill", "#000")
      .text(meter.id);

    if (isModify) {
      const drag = d3
        .drag<SVGCircleElement, WaterMeter>()
        .on("drag", (event, d) => {
          if (!svg.node()) return;
          const [xPx, yPx] = d3.pointer(event, svg.node()); // pointer in SVG coords
          const x = (xPx / svgWidth) * 100;
          const y = (yPx / svgHeight) * 100;
          setMeters(d.id, { ...d, x, y });
        });

      circle.call(drag);
    }
  });
}
