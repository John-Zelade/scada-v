import * as d3 from "d3";
import type {
  PipePoint,
  Pipes,
  SelectedComponent,
  WaterMeter,
  WaterSupply,
} from "../../types/map";

import BX9 from "../../../assets/B39-water-meter.png";
import WaterSupplyImg from "../../../assets/water_supply.png";
import { GroupDragHandler, toggleSelection } from "../util";
import { isSelected } from "../helper";
import { createDragHandlers } from "../util";
// Each pipe will track its own animation frame
const pipeAnimationFrames: Record<string, number> = {};
const waterMeterAnimationFrames: Record<string, number> = {};

export function drawPipe(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  pipes: Pipes[],
  setPipes: (id: string, meter: Pipes) => void,
  svgWidth: number,
  svgHeight: number,

  isModify: boolean,

  selectedComponents: SelectedComponent[],
  setSelectedComponents: React.Dispatch<
    React.SetStateAction<SelectedComponent[]>
  >,
  meters?: WaterMeter[]
) {
  svg.selectAll(".water-pipe").remove();
  //console.log(`Pipes List:`, pipes);

  const g = svg.select(".zoom-layer");
  pipes.forEach((pipe) => {
    const { id, points } = pipe;

    const existingPipe = g.select(`.pipe-group-${id}`);
    if (!existingPipe.empty()) existingPipe.remove();

    // Create or update a group dedicated to this id
    const pipeGroup = g
      .selectAll(`.pipe-group-${id}`)
      .data([pipe]) // bind only this pipe’s data
      .join("g")
      .attr("class", `pipe-group pipe-group-${id}`);

    // Stop only this pipe's previous animation
    if (pipeAnimationFrames[id]) {
      cancelAnimationFrame(pipeAnimationFrames[id]);
    }

    if (isModify && selectedComponents.length > 0) {
      GroupDragHandler({
        svg,
        selectedComponents,
        pipes,
        setPipes,
        svgWidth,
        svgHeight,
      });
    }

    const toPixel = (p: PipePoint) => {
      let baseX: number;
      let baseY: number;

      baseX = (p.x / 100) * svgWidth;
      baseY = (p.y / 100) * svgHeight;

      const x = baseX;
      const y = baseY;

      return { x, y };
    };

    // Create polyline path
    const linePoints = points
      .map((p) => {
        const { x, y } = toPixel(p);
        return `${x},${y}`;
      })
      .join(" ");

    // --- Outer border layer (gray pipe border) ---
    const outerBorderbasePipeThickness = Math.min(svgWidth, svgHeight) * 0.009; // base thickness (0.5%)
    const outerBorderadjustedPipeThickness = outerBorderbasePipeThickness;

    pipeGroup
      .append("polyline")
      .attr("points", linePoints)
      .attr("stroke", "#575757") // metallic gray
      .attr("stroke-width", outerBorderadjustedPipeThickness) // border thickness
      .attr("fill", "none")
      .attr("stroke-linejoin", !isModify ? "round" : "miter"); //Rounded corners when not modifying

    // Compute pipe thickness relative to SVG size and zoom
    const basePipeThickness = Math.min(svgWidth, svgHeight) * 0.006; // base thickness (0.5%)
    const adjustedPipeThickness = basePipeThickness;

    const polyline = pipeGroup
      .append("polyline")
      .attr("class", "pipe-inner")
      .attr("points", linePoints)
      .attr(
        "stroke",
        isSelected(selectedComponents, id, "pipe") && isModify
          ? "#8bc3fbff"
          : "#1e90ff"
      )
      .attr(
        "stroke-width",
        isSelected(selectedComponents, id, "pipe") && isModify
          ? 7
          : adjustedPipeThickness
      )
      .attr("fill", "none")
      .attr("stroke-linejoin", !isModify ? "round" : "miter") //Rounded corners when not modifying
      .style(`cursor`, `pointer`)
      .style("opacity", () =>
        isSelected(selectedComponents, id, "pipe") ? 0.6 : 1
      )
      .style("cursor", isModify ? "move" : "pointer")
      .on("mousedown", (event) => event.stopPropagation())
      .on("click", (event) => {
        event.stopPropagation();
        toggleSelection(pipe, "pipe", setSelectedComponents);
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
    const adjustedParticleWidth = baseParticleWidth;
    const adjustedParticleHeight = baseParticleHeight;

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

      pipeAnimationFrames[id] = requestAnimationFrame(animateFlow);
    };

    animateFlow();

    // Compute text position at the midpoint of the pipe
    const midIndex = Math.floor(points.length / 2);
    const midPoint = points[midIndex];
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
        .text(id);
    }

    const size = Math.min(svgWidth, svgHeight) * 0.01;

    /* Mark or point of the pipe angle. Handles multiple points */
    pipe.points.forEach((p, idx) => {
      // Add an internal unique id for each point
      //create temp id for each point
      p.id = `${pipe.id}-pt${idx}`;
    });

    // Drag handles per point
    pipeGroup
      .selectAll<SVGRectElement, PipePoint>("rect.connection-point")
      .data(pipe.points)
      .join("rect")
      .attr("class", "connection-point")
      .attr("width", size)
      .attr("height", size)

      .style("cursor", "pointer")
      .style("display", isModify ? "block" : "none")
      .attr("x", (d) => (d.x / 100) * svgWidth - size / 2)
      .attr("y", (d) => (d.y / 100) * svgHeight - size / 2)
      .style("opacity", (d) => {
        return isSelected(selectedComponents, d.id, "connection-point")
          ? 0.6
          : 1;
      })
      .attr("fill", (d) =>
        isSelected(selectedComponents, d.id, "connection-point")
          ? "#007bff" // bright blue fill when selected
          : "#ffffff"
      )
      .attr("stroke", (d) =>
        isSelected(selectedComponents, d.id, "connection-point")
          ? "#ff4757" // red border to stand out
          : "#007bff"
      )
      .attr("stroke-width", (d) =>
        isSelected(selectedComponents, d.id, "connection-point") ? 1.5 : 1
      )
      .on("mousedown", (event) => event.stopPropagation())
      .on("click", (event, d) => {
        event.stopPropagation();
        toggleSelection(d, "connection-point", setSelectedComponents);
      })
      .call(
        createDragHandlers<SVGRectElement, PipePoint>(
          svg,
          (point) => point,
          (point, x, y) => ({ ...point, x, y }),
          (pointId, updatedPoint) => {
            const updatedPipe = {
              ...pipe,
              points: pipe.points.map((p) =>
                p.id === updatedPoint.id ? updatedPoint : p
              ),
            };
            setPipes(pipe.id, updatedPipe);
          },
          svgWidth,
          svgHeight
        )
      );
  });
}

/*  Handle water meter */
export function drawWaterMeter(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  meters: WaterMeter[],
  setMeters: (id: string, meter: WaterMeter) => void,
  svgWidth: number,
  svgHeight: number,

  isModify: boolean = false,

  selectedComponents: SelectedComponent[],
  setSelectedComponents: React.Dispatch<
    React.SetStateAction<SelectedComponent[]>
  >
) {
  // Remove existing meters
  svg.selectAll(".water-meter").remove();
  // Ensure we have a map layer
  const g = svg.select(".zoom-layer");
  if (g.empty()) return;

  meters.forEach((meter) => {
    const meterGroup = g
      .append("g")
      .attr("class", `water-meter meter-${meter.id}`);

    // Apply zoom transform to position
    const posX = (meter.points[0].x / 100) * svgWidth;
    const posY = (meter.points[0].y / 100) * svgHeight;

    const radius = Math.min(svgWidth, svgHeight) * 0.028;

    const circle =
      //use this for image
      meterGroup
        .append("image")
        .data([meter])
        .attr("href", BX9) // <-- your image path
        .attr("x", posX - radius)
        .attr("y", posY - radius)
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
        .style("opacity", () =>
          isSelected(selectedComponents, meter.id, "water-meter") ? 0.6 : 1
        )
        .style("cursor", isModify ? "move" : "pointer")
        .on("mousedown", (event) => event.stopPropagation())
        .on("click", (event) => {
          event.stopPropagation();
          toggleSelection(meter, "water-meter", setSelectedComponents);
        });

    // Responsive meter label
    meterGroup
      .append("text")
      .attr("x", posX)
      .attr("y", posY - radius + 1) // slightly above the meter
      .attr("text-anchor", "middle")
      .attr("fill", "#000")
      .style("font-size", `${8}px`)
      .style("font-weight", 600)
      .text(meter.id);

    if (isModify) {
      const drag = createDragHandlers<SVGImageElement, WaterMeter>(
        svg,
        (meter) => meter.points[0], // get position
        (meter, x, y) => ({
          ...meter,
          points: [{ x, y }, ...meter.points.slice(1)],
        }),
        setMeters,
        svgWidth,
        svgHeight
      );

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

  isModify: boolean = false,

  selectedComponents: SelectedComponent[],
  setSelectedComponents: React.Dispatch<
    React.SetStateAction<SelectedComponent[]>
  >
) {
  //console.log(`Water Supply: `, supplies);

  // Remove existing meters
  svg.selectAll(".water-supply").remove();

  supplies.forEach((supply) => {
    const g = svg.select(".zoom-layer");
    const supplyGroup = g
      .append("g")
      .attr("class", `water-supply supply-${supply.id}`);

    // Apply zoom transform to position
    const posX = (supply.points[0].x / 100) * svgWidth;
    const posY = (supply.points[0].y / 100) * svgHeight;

    const radius = Math.min(svgWidth, svgHeight) * 0.028;

    const circle =
      //use this for image
      supplyGroup
        .append("image")
        .data([supply])
        .attr("href", WaterSupplyImg) // <-- your image path
        .attr("x", posX - radius)
        .attr("y", posY - radius)
        .attr("width", radius * 3.5)
        .attr("height", radius * 3.5)
        .attr("clip-path", "circle(50%)") // keeps it circular

        /* supplyGroup
        .append("circle")
        .datum(supply) // <-- bind the datum here
        .attr("cx", posX)
        .attr("cy", posY)
        .attr("r", radius)
        .attr(
          "fill",
          selectedSupply === supply.id && isModify ? "#8bc4fcff" : "#727272ff"
        )
        .attr("stroke", "#007bff")
        .attr("stroke-width", 1) */
        .style("opacity", () =>
          isSelected(selectedComponents, supply.id, "water-supply") ? 0.6 : 1
        )
        .style("cursor", isModify ? "move" : "pointer")
        .on("mousedown", (event) => event.stopPropagation())
        .on("click", (event) => {
          event.stopPropagation();
          toggleSelection(supply, "water-supply", setSelectedComponents);
        });

    // Meter label
    supplyGroup
      .append("text")
      .attr("x", posX + 8)
      .attr("y", posY - 5)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .attr("fill", "#000")
      .text(supply.id);

    if (isModify) {
      const drag = createDragHandlers<SVGImageElement, WaterSupply>(
        svg,
        (tank) => tank.points[0],
        /* Function use to set updated points */
        (tank, x, y) => {
          //console.log(`Tank:`, tank);

          return {
            ...tank,
            points: [{ x, y }, ...tank.points.slice(1)],
          };
        },
        setSupplies,
        svgWidth,
        svgHeight
      );
      circle.call(drag);
    }
  });
}
