import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

import { KeyCntrls } from "./key-ctrls";
import {
  drawPipe,
  drawPressureGauge,
  drawWaterMeter,
  drawWaterSupply,
  drawWaterTank,
} from "./components/scada-components";
import {
  water_meters,
  water_supply,
  Elements,
} from "@/lib/mock-data/mock-data";
import { drawGrid } from "./util";
import { handleMouseDown, handleMouseMove, handleMouseUp } from "./util";
import type {
  WaterMeter,
  SelectedComponent,
  WaterSupply,
  ShapesType,
} from "../types/map";
import { drawCircle } from "./components/shapes/circle";

interface SCADAMapProps {
  modifiedShapes: ShapesType[];
  setModifiedShapes: React.Dispatch<React.SetStateAction<ShapesType[]>>;

  elements: ShapesType;
  setElements: React.Dispatch<React.SetStateAction<ShapesType>>;

  pendingElements: ShapesType[];
  setPendingElements: React.Dispatch<React.SetStateAction<ShapesType[]>>;

  isModify: boolean;
  showElements: boolean;
  width?: number;
  height?: number;
}

type ToolType = "pipe" | "tank" | "meter" | null;

export function SCADAMap({
  modifiedShapes,
  setModifiedShapes,

  elements,
  setElements,

  pendingElements,
  setPendingElements,

  isModify,
  showElements,
  width = 600,
  height = 400,
}: SCADAMapProps) {
  //console.log(`modifiedShapes: `, modifiedShapes);
  //console.log(`elements: `, elements);

  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width, height });

  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [zoomScale, setZoomScale] = useState(1);

  const [selectedTool, setSelectedTool] = useState<ToolType>(null);
  const [selectedComponents, setSelectedComponents] = useState<
    SelectedComponent[]
  >([]);
  //console.log(`selectedComponents`, selectedComponents);
  //console.log(`elements:`, elements);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    const update = () => {
      if (!svgRef.current) return;

      const { width, height } = svgRef.current.getBoundingClientRect();
      //console.log("Measured SVG:", width, height);
      setDimensions({ width, height });

      // Always clear existing grid first
      svg.selectAll(".grid-lines").remove();

      drawGrid(svg, { width, height }, isModify);
    };

    update(); // run once immediately
    window.addEventListener("resize", update);

    return () => window.removeEventListener("resize", update);
  }, [isModify]);

  /* Handles Zoom and Pan */
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select(".zoom-layer");

    const enabledZoomOut = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 100]) // allow zoom out more
      .on("zoom", (event) => {
        const { k: scale, x, y } = event.transform;
        g.attr("transform", `translate(${x}, ${y}) scale(${scale})`);
        setZoomScale(scale);
      });

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 100]) // restrict min zoom
      .on("zoom", (event) => {
        const { k: scale, x, y } = event.transform;

        // When scale = 1, ignore translate so user can't pan
        if (scale <= 1) {
          g.attr("transform", `scale(1)`);
          setZoomScale(1);
        } else {
          g.attr("transform", `translate(${x}, ${y}) scale(${scale})`);
          setZoomScale(scale);
        }
      });

    // Clear any previous zoom handlers before reapplying
    svg.on(".zoom", null);

    svg.call(isModify ? enabledZoomOut : zoom);
  }, [isModify]);

  /* Move element using arrow key */
  useEffect(() => {
    const moveStep = 1 / zoomScale;
    //console.log(`moveStep`, moveStep);

    const keyControls = new KeyCntrls(
      () => selectedComponents,
      setElements,
      moveStep, //movement speed and distance base on how zoom
      setSelectedComponents,
      () => isModify
    );

    return () => keyControls.destroy();
  }, [selectedComponents, isModify]);

  /* ====================================================================================
                                    Draw Circle Elements
  =====================================================================================*/
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    // Clear or draw per shape type
    drawCircle(
      svg,
      elements,
      setElements,

      modifiedShapes,
      setModifiedShapes,

      dimensions.width,
      dimensions.height,
      isModify,
      selectedComponents,
      setSelectedComponents
    );
  }, [elements, dimensions, isModify, selectedComponents]);

  /* ====================================================================================
                                    Draw Pipe Elements
  =====================================================================================*/
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    // Safely extract pipe elements from the 'elements' state
    const pipeElements = elements?.pipe || [];

    // Draw pipes
    drawPipe(
      svg,
      pipeElements,
      (id, updatedPipe) =>
        setElements((prev) => ({
          ...prev,
          pipe: prev.pipe.map((p) => (p.id === id ? updatedPipe : p)),
        })),
      dimensions.width,
      dimensions.height,
      isModify,
      selectedComponents,
      setSelectedComponents
    );
  }, [elements, dimensions, isModify, selectedComponents]);

  /* ====================================================================================
                                    Draw Meter Elements
  =====================================================================================*/
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    drawWaterMeter(
      svg,
      elements,
      setElements,

      modifiedShapes,
      setModifiedShapes,

      dimensions.width,
      dimensions.height,
      isModify,
      selectedComponents,
      setSelectedComponents
    );
  }, [elements, dimensions, isModify, selectedComponents]);

  /* ====================================================================================
                                    Draw Water Supply Elements
  =====================================================================================*/
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    drawWaterSupply(
      svg,
      elements,
      setElements,

      modifiedShapes,
      setModifiedShapes,

      dimensions.width,
      dimensions.height,
      isModify,
      selectedComponents,
      setSelectedComponents
    );
  }, [elements, dimensions, isModify, selectedComponents]);

  /* ====================================================================================
                                    Draw Water Tanks Element
  =====================================================================================*/
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    drawWaterTank(
      svg,
      elements,
      setElements,

      modifiedShapes,
      setModifiedShapes,

      dimensions.width,
      dimensions.height,
      isModify,
      selectedComponents,
      setSelectedComponents
    );
  }, [elements, dimensions, isModify, selectedComponents]);

  /* ====================================================================================
                           Draw Water Pressure Transmitter Element
  =====================================================================================*/
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    drawPressureGauge(
      svg,
      elements,
      setElements,

      modifiedShapes,
      setModifiedShapes,

      dimensions.width,
      dimensions.height,
      isModify,
      selectedComponents,
      setSelectedComponents
    );
  }, [elements, dimensions, isModify, selectedComponents]);

  // Add new pipe dynamically
  const addPipe = () => {
    setElements((prev) => {
      // make sure 'pipe' array exists
      const existingPipes = prev.pipe || [];
      const pipeCount = existingPipes.length + 1;

      const newPipe = {
        id: `pipe${pipeCount}`,
        points: [
          { id: `${pipeCount}-p0`, x: 20, y: 30 }, // start point
          { id: `${pipeCount}-p1`, x: 50, y: 30 }, // end point
        ],
      };

      // return new state with added pipe
      return {
        ...prev,
        pipe: [...existingPipes, newPipe],
      };
    });
  };

  // Add this inside your SCADAMap component

  // Duplicate selected pipe function
  /* const duplicatePipe = () => {
    if (!selectedPipe) return;

    setElements((prev) => {
      const pipes = prev.pipe || [];
      const original = pipes.find((p) => p.id === selectedPipe);
      if (!original) return prev;

      const newId = `pipe${pipes.length + 1}`;
      const duplicated = {
        id: newId,
        points: original.points.map((point: any) => ({
          id: point.id,
          x: point.x + 2, // small offset to avoid overlap
          y: point.y + 2,
        })),
      };

      return {
        ...prev,
        pipe: [...pipes, duplicated],
      };
    });

    setSelectedPipe(() => `pipe${Elements.pipe.length + 1}`);
  }; */

  // Add keyboard listener for Ctrl+D
  /* useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === "d") {
        e.preventDefault(); // prevent browser bookmark
        duplicatePipe();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPipe, elements]); */

  // Handle click on canvas for placing new pipe points
  /*  const handleSvgClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (selectedTool !== "pipe" || !selectedPipe) return;

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setElements((prev) => {
      const updatedPipes = prev.pipe.map((pipe) => {
        if (pipe.id === selectedPipe) {
          const newPoint = {
            id: `${pipe.id}-p${pipe.points.length + 1}`, // auto-generate point ID
            x,
            y,
          };
          return { ...pipe, points: [...pipe.points, newPoint] };
        }
        return pipe;
      });

      return {
        ...prev,
        pipe: updatedPipes,
      };
    });
  }; */

  return (
    <div
      className="h-full w-full"
      style={{
        position: "relative",
        //backgroundImage: `url(${WaterBranch})`,
        //backgroundSize: "contain",
        //backgroundRepeat: "no-repeat",
        //backgroundPosition: "center",
      }}
    >
      {/* === SCADA Canvas === */}
      <svg
        width={`100%`}
        height={`100%`}
        ref={svgRef}
        onClick={(event) => {
          //handleSvgClick(event);
        }}
        style={{
          display: "block",
        }}
      >
        <g className="zoom-layer border">
          <g className="grid-layer" />
          <g className="map-layer" />
        </g>
      </svg>
    </div>
  );
}
