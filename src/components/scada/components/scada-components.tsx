import * as d3 from "d3";
import type {
  PipePoint,
  Pipes,
  SelectedComponent,
  ShapeItem,
  ShapesType,
  WaterMeter,
  WaterSupply,
} from "../../types/map";
import ReactDOMServer from "react-dom/server";
import { PressureTransmitterGauge, WaterTankIcon } from "@/components/icons";

import BX9 from "../../../assets/B39-water-meter.png";
import WaterSupplyImg from "../../../assets/water_supply.png";
import { drawResizeHandles, toggleSelection } from "../util";
import { isSelected } from "../helper";
import { createDragHandlers } from "../util";
// Each pipe will track its own animation frame
const pipeAnimationFrames: Record<string, number> = {};
const waterMeterAnimationFrames: Record<string, number> = {};

export function drawPipe(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  pipes: Pipes[],
  setPipes: (id: string, pipe: Pipes) => void,
  svgWidth: number,
  svgHeight: number,

  isModify: boolean,

  selectedComponents: SelectedComponent[],
  setSelectedComponents: React.Dispatch<
    React.SetStateAction<SelectedComponent[]>
  >,
  meters?: WaterMeter[]
) {
  const colorText = "#ffff";
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
      .attr("stroke", "#3e3d3dff") // metallic gray
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
          : "#3892f3ff"
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
        if (!isModify) return;
        toggleSelection(pipe, "pipe", setSelectedComponents, true);
      });

    polyline.call(
      d3
        .drag<SVGPolylineElement, Pipes>()
        .on("start", (event, d) => {
          event.sourceEvent.stopPropagation();
          d3.select(event.sourceEvent.target).style("opacity", 0.6);
        })
        .on("drag", (event, d) => {
          const mouseXPos = (event.x / svgWidth) * 100;
          const mouseYPos = (event.y / svgHeight) * 100;

          const dxPercent = (event.dx / svgWidth) * 100;
          const dyPercent = (event.dy / svgHeight) * 100;

          // Move only visually
          d.points = d.points.map((p) => ({
            ...p,
            x: p.x + dxPercent,
            y: p.y + dyPercent,
          }));

          setPipes(d.id, { ...d });
        })

        .on("end", (event, d) => {
          console.log(`event onEnd :`, event);
          console.log(`D end,`, d);

          // Commit final, accurate data to React after drag completes
          //setPipes(d.id, { ...d });
        })
    );

    // --- Flow effect ---
    let totalLength = (polyline.node()?.getTotalLength() ?? 0) || 0;
    //console.log(`total length : ${pipe.id}`, totalLength);

    const minSpacing = 15; // minimum distance between particles
    const minCount = 5; // minimum particles

    let offset = 0;
    // Compute particle count based on pipe length and spacing
    let flowParticleCount =
      totalLength < 30
        ? 2
        : Math.max(minCount, Math.floor(totalLength / minSpacing));

    // --- Particle size (responsive to SVG size + zoom) ---
    const baseParticleWidth = Math.min(svgWidth, svgHeight) * 0.013;
    const baseParticleHeight = Math.min(svgWidth, svgHeight) * 0.004;

    // Adjust particle SIZE with zoom (so they shrink/grow visually)
    const adjustedParticleWidth = baseParticleWidth;
    const adjustedParticleHeight = baseParticleHeight;

    // --- Create particle rectangles ---'
    if (!isModify) {
      const flowRects = Array.from({ length: flowParticleCount }).map(() =>
        pipeGroup
          .append("rect")
          .attr("class", `water-flow`)
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
          const distance = (offset + i * minSpacing) % totalLength;
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
    }

    // Compute text position at the midpoint of the pipe
    const midIndex = Math.floor(points.length / 2);
    const midPoint = points[midIndex];
    const { x: pixelX, y: pixelY } = toPixel(midPoint);

    if (isModify && isSelected(selectedComponents, id, "pipe")) {
      pipeGroup
        .append("text")
        .attr("x", pixelX)
        .attr("y", pixelY - 10) // slightly above the pipe
        .attr("text-anchor", "middle")
        .attr("font-size", 10)
        .attr("fill", `${colorText}`)
        .raise()
        .text(id);
    }

    const size = Math.min(svgWidth, svgHeight) * 0.01;

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
        if (!isModify) return;
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
  elements: ShapesType,
  setElements: React.Dispatch<React.SetStateAction<ShapesType>>,

  modifiedElements: ShapesType[],
  setModifiedElements: React.Dispatch<React.SetStateAction<ShapesType[]>>,

  svgWidth: number,
  svgHeight: number,

  isModify: boolean = false,

  selectedComponents: SelectedComponent[],
  setSelectedComponents: React.Dispatch<
    React.SetStateAction<SelectedComponent[]>
  >
) {
  const colorText = "#ffff";
  // Remove existing meters
  svg.selectAll(".water-meter").remove();

  // Ensure we have a map layer
  const g = svg.select(".zoom-layer");
  if (g.empty()) return;

  elements["water-meters"].forEach((meter) => {
    const meterGroup = g
      .append("g")
      .attr("class", `water-meter meter-${meter.id}`);

    // Apply zoom transform to position
    const posX = (meter.points[0].x / 100) * svgWidth;
    const posY = (meter.points[0].y / 100) * svgHeight;

    const baseSize = Math.min(svgWidth, svgHeight) * 0.028;

    const _meter =
      //use this for image
      meterGroup
        .append("image")
        .data([meter])
        .attr("href", BX9) // <-- your image path
        .attr("x", posX - baseSize)
        .attr("y", posY - baseSize)
        .attr("width", baseSize * 2)
        .attr("height", baseSize * 2)
        .style("opacity", () =>
          isSelected(selectedComponents, meter.id, "water-meters") ? 0.6 : 1
        )
        .style("cursor", isModify ? "move" : "pointer")
        .on("mousedown", (event) => event.stopPropagation())
        .on("click", (event) => {
          event.stopPropagation();
          if (!isModify) return;
          toggleSelection(meter, "water-meters", setSelectedComponents);
        });

    // Responsive meter label3
    meterGroup
      .append("text")
      .attr("x", posX)
      .attr("y", posY - baseSize) // slightly above the meter
      .attr("text-anchor", "middle")
      .attr("fill", `${colorText}`)
      .style("font-size", `${8}px`)
      .style("font-weight", 600)
      .text(meter.name ?? "--");

    if (!isModify) {
      meterGroup
        .append("text")
        .attr("x", posX)
        .attr("y", posY + 2)
        .attr("text-anchor", "middle")
        .attr("fill", `${colorText}`)
        .style("font-size", `${4}px`)
        .style("font-weight", 600)
        .text(`${String(meter.value ?? 0)}m³`);
    }

    // Draw resize handles if selected
    const _isElementSelected = isSelected(
      selectedComponents,
      meter.id,
      "water-meters"
    );
    if (_isElementSelected) {
      if (_isElementSelected) {
        drawResizeHandles({
          svg,
          svgGroup: meterGroup,
          posX: posX - (baseSize * 15.5) / 15.5,
          posY: posY - (baseSize * 8.5) / 8.5,
          width: baseSize * 2,
          height: baseSize * 2,
          selectedComponents,
          elementId: meter.id,
          elementType: "water-meters",
          setElements,
          element: meter,
        });
      }
    }

    if (isModify) {
      const drag = createDragHandlers<SVGImageElement, ShapeItem>(
        svg,
        (d) => d.points[0], // get position
        (d, x, y) => ({
          ...d,
          points: [{ ...d.points[0], x, y }, ...d.points.slice(1)], // ✅ updates the first point
        }),
        (
          id,
          updated // ✅ correct setter usage
        ) =>
          setElements((prev) => ({
            ...prev,
            ["water-meters"]: prev["water-meters"].map((wm) =>
              wm.id === id ? updated : wm
            ),
          })),
        svgWidth,
        svgHeight
      );

      _meter.call(drag);
    }
  });
}

/* Handle Water Supply */
export function drawWaterSupply(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  elements: ShapesType,
  setElements: React.Dispatch<React.SetStateAction<ShapesType>>,

  modifiedElements: ShapesType[],
  setModifiedElements: React.Dispatch<React.SetStateAction<ShapesType[]>>,
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

  elements["water-supply"].forEach((supply) => {
    const g = svg.select(".zoom-layer");
    const supplyGroup = g
      .append("g")
      .attr("class", `water-supply supply-${supply.id}`);

    // Apply zoom transform to position
    const posX = (supply.points[0].x / 100) * svgWidth;
    const posY = (supply.points[0].y / 100) * svgHeight;

    const baseSize = Math.min(svgWidth, svgHeight) * 0.032;

    const _supply =
      //use this for image
      supplyGroup
        .append("image")
        .data([supply])
        .attr("href", WaterSupplyImg)
        .attr("x", posX - baseSize)
        .attr("y", posY - baseSize)
        .attr("width", baseSize * 3.5)
        .attr("height", baseSize * 2)
        .style("opacity", () =>
          isSelected(selectedComponents, supply.id, "water-supply") ? 0.6 : 1
        )
        .style("cursor", isModify ? "move" : "pointer")
        .on("mousedown", (event) => event.stopPropagation())
        .on("click", (event) => {
          event.stopPropagation();
          if (!isModify) return;
          toggleSelection(supply, "water-supply", setSelectedComponents);
        });

    // Draw resize handles if selected
    const _isElementSelected = isSelected(
      selectedComponents,
      supply.id,
      "water-supply"
    );
    if (_isElementSelected) {
      if (_isElementSelected) {
        drawResizeHandles({
          svg,
          svgGroup: supplyGroup,
          posX: posX - (baseSize * 15.5) / 15.5,
          posY: posY - (baseSize * 8.5) / 8.5,
          width: baseSize * 3.5,
          height: baseSize * 2,
          selectedComponents,
          elementId: supply.id,
          elementType: "water-supply",
          setElements,
          element: supply,
        });
      }
    }

    if (isModify) {
      const drag = createDragHandlers<SVGImageElement, ShapeItem>(
        svg,
        (d) => d.points[0], // get position
        /* Function use to set updated points */
        (d, x, y) => ({
          ...d,
          points: [{ ...d.points[0], x, y }, ...d.points.slice(1)], // ✅ updates the first point
        }),
        (
          id,
          updated // ✅ correct setter usage
        ) =>
          setElements((prev) => ({
            ...prev,
            ["water-supply"]: prev["water-supply"].map((ws) =>
              ws.id === id ? updated : ws
            ),
          })),
        svgWidth,
        svgHeight
      );
      _supply.call(drag);
    }
  });
}

/* ====================================================================================
                                    Draw Water Tanks Element
  =====================================================================================*/
/* Handle Water Tank */
export function drawWaterTank(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  elements: ShapesType,
  setElements: React.Dispatch<React.SetStateAction<ShapesType>>,

  modifiedElements: ShapesType[],
  setModifiedElements: React.Dispatch<React.SetStateAction<ShapesType[]>>,
  svgWidth: number,
  svgHeight: number,

  isModify: boolean = false,

  selectedComponents: SelectedComponent[],
  setSelectedComponents: React.Dispatch<
    React.SetStateAction<SelectedComponent[]>
  >
) {
  const colorText = "#252424ff";
  // Remove existing tanks
  svg.selectAll(".water-tanks").remove();

  elements["water-tanks"].forEach((tank) => {
    const g = svg.select(".zoom-layer");
    const tankGroup = g
      .append("g")
      .attr("class", `water-tanks tank-${tank.id}`);

    // Apply zoom transform to position
    const posX = (tank.points[0].x / 100) * svgWidth;
    const posY = (tank.points[0].y / 100) * svgHeight;

    const baseSize = Math.min(svgWidth, svgHeight) * 0.025;

    const svgMarkup = ReactDOMServer.renderToStaticMarkup(
      <WaterTankIcon
        value={isModify ? "" : String(tank.value) || "0"}
        height={baseSize * 8}
      />
    );

    const __tank =
      //use this for image
      tankGroup
        .append("foreignObject")
        .data([tank])
        .attr("x", posX - baseSize)
        .attr("y", posY - baseSize)

        .html(svgMarkup)
        .attr("width", baseSize * 15.5)
        .attr("height", baseSize * 8.5)
        .style("opacity", () =>
          isSelected(selectedComponents, tank.id, "water-tanks") ? 0.6 : 1
        )
        .style("cursor", isModify ? "move" : "pointer")
        .on("mousedown", (event) => event.stopPropagation())
        .on("click", (event) => {
          event.stopPropagation();
          if (!isModify) return;
          toggleSelection(tank, "water-tanks", setSelectedComponents);
        });

    // Meter label
    if (!isModify) {
      tankGroup
        .append("text")
        .attr("x", posX + baseSize)
        .attr("y", posY - baseSize - 1) // slightly above the meter
        .attr("text-anchor", "middle")
        .attr("fill", `#ffff`)
        .style("font-size", `${10}px`)
        .style("font-weight", 600)
        .text(`${tank.name}`);

      /*     tankGroup
        .append("text")
        .attr("x", (posX + baseSize) * 1.45)
        .attr("y", posY - baseSize + 66) // slightly above the meter
        .attr("text-anchor", "middle")
        .attr("fill", `${colorText}`)
        .style("font-size", `${10}px`)
        .style("font-weight", 600)
        .text(`${tank.value ?? 0}%`);

      tankGroup
        .append("text")
        .attr("x", (posX + baseSize) * 1.45)
        .attr("y", posY - baseSize + 75) // slightly above the meter
        .attr("text-anchor", "middle")
        .attr("fill", `${colorText}`)
        .style("font-size", `${10}px`)
        .style("font-weight", 600)
        .text("Water Level"); */
    }
    if (isSelected(selectedComponents, tank.id, "water-tanks")) {
      tankGroup
        .append("text")
        .attr("x", posX + 190)
        .attr("y", posY)
        .attr("text-anchor", "middle")
        .attr("font-size", 10)
        .attr("font-weight", 500)
        .attr("fill", `${colorText}`)
        .text(`${tank.name}`);
    }

    // Draw resize handles if selected
    const _isElementSelected = isSelected(
      selectedComponents,
      tank.id,
      "water-tanks"
    );
    if (_isElementSelected) {
      if (_isElementSelected) {
        drawResizeHandles({
          svg,
          svgGroup: tankGroup,
          posX: posX - (baseSize * 15.5) / 15.5,
          posY: posY - (baseSize * 8.5) / 8.5,
          width: baseSize * 15.5,
          height: baseSize * 8.5,
          selectedComponents,
          elementId: tank.id,
          elementType: "water-tanks",
          setElements,
          element: tank,
        });
      }
    }

    if (isModify) {
      const drag = createDragHandlers<SVGForeignObjectElement, ShapeItem>(
        svg,
        (d) => d.points[0], // get position
        /* Function use to set updated points */
        (d, x, y) => ({
          ...d,
          points: [{ ...d.points[0], x, y }, ...d.points.slice(1)], // ✅ updates the first point
        }),
        (
          id,
          updated // ✅ correct setter usage
        ) =>
          setElements((prev) => ({
            ...prev,
            ["water-tanks"]: prev["water-tanks"].map((ws) =>
              ws.id === id ? updated : ws
            ),
          })),
        svgWidth,
        svgHeight
      );
      __tank.call(drag);
    }
  });
}

/* ====================================================================================
                                    Draw Water Pressure Element
  =====================================================================================*/
/* Handle Water Tank */
export function drawPressureGauge(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  elements: ShapesType,
  setElements: React.Dispatch<React.SetStateAction<ShapesType>>,

  modifiedElements: ShapesType[],
  setModifiedElements: React.Dispatch<React.SetStateAction<ShapesType[]>>,
  svgWidth: number,
  svgHeight: number,

  isModify: boolean = false,

  selectedComponents: SelectedComponent[],
  setSelectedComponents: React.Dispatch<
    React.SetStateAction<SelectedComponent[]>
  >
) {
  const colorText = "#ffff";
  // Remove existing tanks
  svg.selectAll(".water-pressure").remove();

  elements["water-pressure"].forEach((pt) => {
    const g = svg.select(".zoom-layer");
    const ptGroup = g
      .append("g")
      .attr("class", `water-pressure pressure-${pt.id}`);

    // Apply zoom transform to position
    const posX = (pt.points[0].x / 100) * svgWidth;
    const posY = (pt.points[0].y / 100) * svgHeight;

    const baseSize = Math.min(svgWidth, svgHeight) * 0.025;

    const svgMarkup = ReactDOMServer.renderToStaticMarkup(
      <PressureTransmitterGauge
        value={isModify ? 0 : Number(pt.value) || 0}
        size={pt?.width || 10}
      />
    );

    const __pt =
      //use this for image
      ptGroup
        .append("foreignObject")
        .data([pt])
        .attr("x", posX)
        .attr("y", posY)

        .html(svgMarkup)
        .attr("width", pt?.width || 10)
        .attr("height", pt?.height || 10)
        .style("opacity", () =>
          isSelected(selectedComponents, pt.id, "water-pressure") ? 0.6 : 1
        )
        .style("cursor", isModify ? "move" : "pointer")
        .on("mousedown", (event) => event.stopPropagation())
        .on("click", (event) => {
          event.stopPropagation();
          if (!isModify) return;
          toggleSelection(pt, "water-pressure", setSelectedComponents);
        });

    const foreignObj = __pt.node() as SVGForeignObjectElement;
    const ptDiv = foreignObj.querySelector(".pressure-gauge") as HTMLDivElement;
    const { width, height } = ptDiv.getBoundingClientRect();

    //Draw resize handles if selected
    const _isElementSelected = isSelected(
      selectedComponents,
      pt.id,
      "water-pressure"
    );

    if (_isElementSelected) {
      drawResizeHandles({
        svg,
        svgGroup: ptGroup,
        posX: posX - (pt?.width || 10) / (pt?.width || 10),
        posY: posY - (pt?.height || 10) / (pt?.height || 10),
        width: pt?.width || 10,
        height: pt?.height || 10,
        selectedComponents,
        elementId: pt.id,
        elementType: "water-pressure",
        setElements,
        element: pt,
      });
    }

    // Meter label
    if (!isModify) {
      // Top-right label (pt name)
      ptGroup
        .append("text")
        .attr("x", posX + width / 2) // right edge minus padding
        .attr("y", posY - 4) // top edge plus padding
        .attr("text-anchor", "middle")
        .attr("font-size", 10)
        .attr("font-weight", 500)
        .attr("fill", `${colorText}`)
        .text(`${pt.name}`);
    }
    if (isSelected(selectedComponents, pt.id, "water-pressure")) {
      ptGroup
        .append("text")
        .attr("x", posX + width / 2) // right edge minus padding
        .attr("y", posY - 5) // top edge plus padding
        .attr("text-anchor", "middle")
        .attr("font-size", 10)
        .attr("font-weight", 500)
        .attr("fill", `${colorText}`)
        .text(`${pt.name}`);
    }

    if (isModify) {
      const drag = createDragHandlers<SVGForeignObjectElement, ShapeItem>(
        svg,
        (d) => d.points[0], // get position
        /* Function use to set updated points */
        (d, x, y) => ({
          ...d,
          points: [{ ...d.points[0], x, y }, ...d.points.slice(1)], // ✅ updates the first point
        }),
        (
          id,
          updated // ✅ correct setter usage
        ) =>
          setElements((prev) => ({
            ...prev,
            ["water-pressure"]: prev["water-pressure"].map((ws) =>
              ws.id === id ? updated : ws
            ),
          })),
        svgWidth,
        svgHeight
      );
      __pt.call(drag);
    }
  });
}
