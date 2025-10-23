import * as d3 from "d3";
import type { WaterMeter, WaterSupply } from "../types/map";
export interface PipePointPercent {
  x: number;
  y: number;
  linkedMeterId?: string;
}
import BX9 from "../../assets/B39-water-meter.png";
import WaterSupplyImg from "../../assets/water_supply.png";

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
  setSelectedPipe?: React.Dispatch<React.SetStateAction<string | null>>,
  meters?: WaterMeter[]
) {
  const g = svg.select(".map-layer");

  const existingPipe = g.select(`.pipe-group-${pipeId}`);
  if (!existingPipe.empty()) existingPipe.remove();
  // Create or update a group dedicated to this pipeId
  const pipeGroup = g
    .selectAll(`.pipe-group-${pipeId}`)
    .data([pipePoints]) // bind only this pipe’s data
    .join("g")
    .attr("class", `pipe-group pipe-group-${pipeId}`);

  // Stop only this pipe's previous animation
  if (pipeAnimationFrames[pipeId]) {
    cancelAnimationFrame(pipeAnimationFrames[pipeId]);
  }
  // Get current zoom/pan transform (so everything stays aligned)
  const transform = d3.zoomTransform(svg.node() as any);
  // --- Inner fill layer (blue water inside pipe) ---
  const zoomLevel = transform.k;

  const toPixel = (p: PipePointPercent) => {
    let baseX: number;
    let baseY: number;

    // If linked to a meter, use that meter’s coordinates
    if (p.linkedMeterId && meters) {
      const m = meters.find((mm) => mm.id === p.linkedMeterId);
      if (m) {
        baseX = (m.x / 100) * svgWidth;
        baseY = (m.y / 100) * svgHeight;
      } else {
        baseX = (p.x / 100) * svgWidth;
        baseY = (p.y / 100) * svgHeight;
      }
    } else {
      baseX = (p.x / 100) * svgWidth;
      baseY = (p.y / 100) * svgHeight;
    }

    const applied = transform.apply([baseX, baseY]);
    const x = applied[0];
    const y = applied[1];

    return { x, y };
  };

  // Create polyline path
  const linePoints = pipePoints
    .map((p) => {
      const { x, y } = toPixel(p);
      return `${x},${y}`;
    })
    .join(" ");

  // --- Outer border layer (gray pipe border) ---
  const outerBorderbasePipeThickness = Math.min(svgWidth, svgHeight) * 0.015; // base thickness (0.5%)
  const outerBorderadjustedPipeThickness =
    outerBorderbasePipeThickness / zoomLevel;

  pipeGroup
    .append("polyline")
    .attr("points", linePoints)
    .attr("stroke", "#575757") // metallic gray
    .attr("stroke-width", outerBorderadjustedPipeThickness) // border thickness
    .attr("fill", "none")
    .attr("stroke-linejoin", !isModify ? "round" : "miter"); //Rounded corners when not modifying

  // Compute pipe thickness relative to SVG size and zoom
  const basePipeThickness = Math.min(svgWidth, svgHeight) * 0.01; // base thickness (0.5%)
  const adjustedPipeThickness = basePipeThickness / zoomLevel;
  const polyline = pipeGroup
    .append("polyline")
    .attr("class", "pipe-inner")
    .attr("points", linePoints)
    .attr(
      "stroke",
      selectedPipe === pipeId && isModify ? "#8bc3fbff" : "#1e90ff"
    )
    .attr(
      "stroke-width",
      selectedPipe === pipeId && isModify ? 7 : adjustedPipeThickness
    )
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
  const totalLength = (polyline.node()?.getTotalLength() ?? 0) || 0;

  // Keep spacing constant in SVG coordinate space (independent of zoom)
  const particleSpacing = 15;
  let offset = 0;
  const flowParticleCount = Math.max(
    5,
    Math.floor(totalLength / particleSpacing)
  );

  // --- Particle size (responsive to SVG size + zoom) ---
  const baseParticleWidth = Math.min(svgWidth, svgHeight) * 0.013;
  const baseParticleHeight = Math.min(svgWidth, svgHeight) * 0.004;

  // Adjust particle SIZE with zoom (so they shrink/grow visually)
  const adjustedParticleWidth = baseParticleWidth / zoomLevel;
  const adjustedParticleHeight = baseParticleHeight / zoomLevel;

  // --- Create particle rectangles ---
  const flowRects = Array.from({ length: flowParticleCount }).map(() =>
    pipeGroup
      .append("rect")
      .attr("width", adjustedParticleWidth)
      .attr("height", adjustedParticleHeight)
      .attr("fill", "#4ac4f8ff")
      .attr("rx", adjustedParticleHeight / 2)
      .attr("ry", adjustedParticleHeight / 2)
  );

  // --- Animate flow ---
  const animateFlow = () => {
    if (!polyline.node()) return;

    if (isModify) {
      flowRects.forEach((rect) => rect.attr("display", "none"));
      return;
    }

    offset = (offset + 1) % totalLength;

    flowRects.forEach((rect, i) => {
      const distance = (offset + i * particleSpacing) % totalLength;
      const point = polyline.node()!.getPointAtLength(distance);
      const nextPoint = polyline
        .node()!
        .getPointAtLength((distance + 2) % totalLength);
      const angle =
        Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) *
        (180 / Math.PI);

      rect
        .attr("x", point.x - adjustedParticleWidth / 2)
        .attr("y", point.y - adjustedParticleHeight / 2)
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
      setPipePoints(pipeId, newPoints);
      d3.select(`.pipe-group-${pipeId}`).remove(); // remove only this one
      drawPipe(
        isModify,
        svg,
        newPoints,
        setPipePoints,
        svgWidth,
        svgHeight,
        pipeId,
        selectedPipe,
        setSelectedPipe,
        meters
      );
    });

  // Compute text position at the midpoint of the pipe
  const midIndex = Math.floor(pipePoints.length / 2);
  const midPoint = pipePoints[midIndex];
  const { x: pixelX, y: pixelY } = toPixel(midPoint);
  if (isModify) {
    pipeGroup
      .append("text")
      .attr("x", pixelX)
      .attr("y", pixelY - 10) // slightly above the pipe
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .attr("fill", "#000")
      .raise()
      .text(pipeId);
  }

  const size = 6;

  pipeGroup
    .selectAll<SVGRectElement, PipePointPercent>("rect.drag-handle")
    .data(pipePoints, (_, i) => i)
    .join(
      (enter) =>
        enter
          .append("rect")
          .attr("class", "drag-handle")
          .attr("width", size)
          .attr("height", size)
          .attr("fill", "#fff")
          .attr("stroke", "#007bff")
          .attr("stroke-width", 1)
          .style("cursor", "pointer")
          .call(drag),
      (update) => update,
      (exit) => exit.remove()
    )
    .attr("x", (d) => transform.applyX((d.x / 100) * svgWidth) - size / 2)
    .attr("y", (d) => transform.applyY((d.y / 100) * svgHeight) - size / 2)
    .style("display", isModify ? "block" : "none")

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
  // Get current zoom transform
  const transform = d3.zoomTransform(svg.node() as Element);

  meters.forEach((meter) => {
    const g = svg.select(".map-layer");
    const meterGroup = g
      .append("g")
      .attr("class", `water-meter meter-${meter.id}`);

    // Apply zoom transform to position
    const [transformedX, transformedY] = transform.apply([
      (meter.x / 100) * svgWidth,
      (meter.y / 100) * svgHeight,
    ]);

    const zoomScale = transform.k;
    const radius = (Math.min(svgWidth, svgHeight) * 0.028) / zoomScale;

    const circle =
      //use this for image
      meterGroup
        .append("image")
        .data([meter])
        .attr("href", BX9) // <-- your image path
        .attr("x", transformedX - radius)
        .attr("y", transformedY - radius)
        .attr("width", radius * 2)
        .attr("height", radius * 2)
        .attr("clip-path", "circle(50%)") // keeps it circular

        /* meterGroup
        .append("circle")
        .datum(meter) // <-- bind the datum here
        .attr("cx", transformedX)
        .attr("cy", transformedY)
        .attr("r", radius)
        .attr(
          "fill",
          selectedMeter === meter.id && isModify ? "#8bc4fcff" : "#727272ff"
        )
        .attr("stroke", "#007bff")
        .attr("stroke-width", 1) */
        .style("cursor", "move")
        .on("click", (event, d) => {
          event.stopPropagation();
          if (setSelectedMeter) {
            setSelectedMeter((prev) => (prev === d.id ? null : d.id));
          }
        });

    // Responsive meter label
    meterGroup
      .append("text")
      .attr("x", transformedX)
      .attr("y", transformedY - radius + 1) // slightly above the meter
      .attr("text-anchor", "middle")
      .attr("fill", "#000")
      .style("font-size", `${8 / zoomScale}px`)
      .style("font-weight", 600)
      .text(meter.id);

    if (isModify) {
      const drag = d3
        //.drag<SVGCircleElement, WaterMeter>()
        .drag<SVGImageElement, WaterMeter>()
        .on("drag", (event, d) => {
          if (!svg.node()) return;
          // Get pointer position (in zoomed space)
          const [xPx, yPx] = transform.invert(d3.pointer(event, svg.node()));

          const x = (xPx / svgWidth) * 100;
          const y = (yPx / svgHeight) * 100;

          setMeters(d.id, { ...d, x, y });
        });

      circle.call(drag);
    }
  });
}

/* Handle Water Supply */
export function drawWaterSupply(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  supplies: WaterSupply[],
  setSupplies: (id: string, meter: WaterSupply) => void,
  svgWidth: number,
  svgHeight: number,
  selectedSupply?: string | null,
  setSelectedSupply?: React.Dispatch<React.SetStateAction<string | null>>,
  isModify: boolean = false
) {
  // Remove existing meters
  svg.selectAll(".water-supply").remove();
  // Get current zoom transform
  const transform = d3.zoomTransform(svg.node() as Element);

  supplies.forEach((supply) => {
    const g = svg.select(".map-layer");
    const supplyGroup = g
      .append("g")
      .attr("class", `water-supply supply-${supply.id}`);

    // Apply zoom transform to position
    const [transformedX, transformedY] = transform.apply([
      (supply.x / 100) * svgWidth,
      (supply.y / 100) * svgHeight,
    ]);

    const zoomScale = transform.k;
    const radius = (Math.min(svgWidth, svgHeight) * 0.028) / zoomScale;

    const circle =
      //use this for image
      supplyGroup
        .append("image")
        .data([supply])
        .attr("href", WaterSupplyImg) // <-- your image path
        .attr("x", transformedX - radius)
        .attr("y", transformedY - radius)
        .attr("width", radius * 3.5)
        .attr("height", radius * 3.5)
        .attr("clip-path", "circle(50%)") // keeps it circular

        /* meterGroup
        .append("circle")
        .datum(meter) // <-- bind the datum here
        .attr("cx", transformedX)
        .attr("cy", transformedY)
        .attr("r", radius)
        .attr(
          "fill",
          selectedMeter === meter.id && isModify ? "#8bc4fcff" : "#727272ff"
        )
        .attr("stroke", "#007bff")
        .attr("stroke-width", 1) */
        .style("cursor", "move")
        .on("click", (event, d) => {
          event.stopPropagation();
          if (setSelectedSupply) {
            setSelectedSupply((prev) => (prev === d.id ? null : d.id));
          }
        });

    // Meter label
    /*  meterGroup
      .append("text")
      .attr("x", transformedX)
      .attr("y", transformedY - 25)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .attr("fill", "#000")
      .text(meter.id); */

    if (isModify) {
      const drag = d3
        //.drag<SVGCircleElement, WaterSupply>()
        .drag<SVGImageElement, WaterSupply>()
        .on("drag", (event, d) => {
          if (!svg.node()) return;
          // Get pointer position (in zoomed space)
          const [xPx, yPx] = transform.invert(d3.pointer(event, svg.node()));

          const x = (xPx / svgWidth) * 100;
          const y = (yPx / svgHeight) * 100;

          setSupplies(d.id, { ...d, x, y });
        });

      circle.call(drag);
    }
  });
}
