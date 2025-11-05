import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

import { KeyCntrls } from "./key-ctrls";
import {
  drawPipe,
  drawWaterMeter,
  drawWaterSupply,
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
  // 🟩 Tool panel position (movable)
  const [panelPos, setPanelPos] = useState({
    x: 89.7, // 90%
    y: 1, // 90%
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const [selectedTool, setSelectedTool] = useState<ToolType>(null);
  const [selectedComponents, setSelectedComponents] = useState<
    SelectedComponent[]
  >([]);
  //console.log(`selectedComponents`, selectedComponents);
  // console.log(`elements:`, elements);

  const [selectedPipe, setSelectedPipe] = useState<string | null>(null);

  // Pipes stored data
  //const [pipes, setPipes] = useState(water_pipes.pipes);
  const [supplies, setSupplies] = useState<WaterSupply[]>(water_supply.supply); // water supply
  //const [meters, setMeters] = useState<WaterMeter[]>(water_meters.meters); // water meter

  useEffect(() => {
    const moveListener = (e: MouseEvent) =>
      handleMouseMove({ e, isDragging, setPanelPos, dragOffset, dimensions });
    const upListener = () => handleMouseUp(setIsDragging);

    if (isDragging) {
      window.addEventListener("mousemove", moveListener);
      window.addEventListener("mouseup", upListener);
    }

    return () => {
      window.removeEventListener("mousemove", moveListener);
      window.removeEventListener("mouseup", upListener);
    };
  }, [isDragging]);

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

      // Only draw grid when modify mode is active
      /* if (isModify) {
        drawGrid(svg, { width, height });
      } */
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
        g.attr("transform", event.transform);
      });

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 100]) // restrict min zoom
      .on("zoom", (event) => {
        const { k: scale, x, y } = event.transform;

        // When scale = 1, ignore translate so user can't pan
        if (scale <= 1) {
          g.attr("transform", `scale(1)`);
        } else {
          g.attr("transform", `translate(${x}, ${y}) scale(${scale})`);
        }
      });

    // Clear any previous zoom handlers before reapplying
    svg.on(".zoom", null);

    svg.call(isModify ? enabledZoomOut : zoom);
  }, [isModify]);

  // Draw Shape Components
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

  // Draw pipes
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

  // Draw meters
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

  /* Draw Water Supply */
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

  /* Move element using arrow key */

  useEffect(() => {
    const keyControls = new KeyCntrls(
      () => selectedComponents,
      setElements,
      0.1,
      setSelectedComponents,
      () => isModify
    );

    return () => keyControls.destroy();
  }, [selectedComponents, isModify]);

  // Add this inside your SCADAMap component

  // Duplicate selected pipe function
  const duplicatePipe = () => {
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
  };

  // Add keyboard listener for Ctrl+D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === "d") {
        e.preventDefault(); // prevent browser bookmark
        duplicatePipe();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPipe, elements]);

  // Handle click on canvas for placing new pipe points
  const handleSvgClick = (event: React.MouseEvent<SVGSVGElement>) => {
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
  };

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
      {/* === Tool Panel === */}
      <div
        className={`${"hidden"} backdrop-blur-md bg-white/20 border border shadow-lg rounded-md p-4 flex flex-col`}
        onMouseDown={(e) =>
          handleMouseDown(e, panelPos, setIsDragging, dragOffset, dimensions)
        }
        style={{
          position: "absolute",
          left: `${(panelPos.x / 100) * dimensions.width}px`,
          top: `${(panelPos.y / 100) * dimensions.height}px`,
          cursor: isDragging ? "grabbing" : "grab",

          userSelect: "none",
        }}
      >
        <h2 className="mb-2 font-semibold">Tools</h2>
        <button
          className={`cursor-pointer mb-2 rounded-md border p-2 text-left ${
            selectedTool === "pipe" ? "bg-blue-200" : "hover:bg-gray-100"
          }`}
          //onClick={addPipe}
          onClick={() => setSelectedTool("pipe")}
        >
          ➕Pipe Elbow
        </button>
        <button
          className={`cursor-pointer mb-2 rounded-md border p-2 text-left hover:bg-gray-100"
          }`}
          onClick={addPipe}
        >
          ➕ Pipe
        </button>
      </div>
      {/* === SCADA Canvas === */}
      <svg
        width={`100%`}
        height={`100%`}
        ref={svgRef}
        onClick={(event) => {
          handleSvgClick(event);
          setSelectedPipe(null);
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
