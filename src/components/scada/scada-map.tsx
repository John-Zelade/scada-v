import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import WaterBranch from "../../assets/water-branch.png";

import { KeyCntrls } from "./key-ctrls";
import { toggleSelection } from "./util";
import {
  drawPipe,
  drawWaterMeter,
  drawWaterSupply,
} from "./components/scada-components";
import {
  water_pipes,
  water_meters,
  water_supply,
  Shapes,
} from "@/lib/mock-data";
import { drawGrid } from "./util";
import { handleMouseDown, handleMouseMove, handleMouseUp } from "./util";
import type {
  WaterMeter,
  SelectedComponent,
  WaterSupply,
  ShapesType,
} from "../types/map";
import { drawCircle } from "./components/shapes/circle";

// Types
interface PipePoint {
  x: number;
  y: number;
  linkedMeterId?: string;
}

interface PipeData {
  id: string;
  points: PipePoint[];
}

interface SCADAMapProps {
  isModify: boolean;
  showElements: boolean;
  width?: number;
  height?: number;
}

type ToolType = "pipe" | "tank" | "meter" | null;

export function SCADAMap({
  isModify,
  showElements,
  width = 600,
  height = 400,
}: SCADAMapProps) {
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

  const [selectedPipe, setSelectedPipe] = useState<string | null>(null);

  // Pipes stored data
  const [pipes, setPipes] = useState(water_pipes.pipes);
  const [supplies, setSupplies] = useState<WaterSupply[]>(water_supply.supply); // water supply
  const [meters, setMeters] = useState<WaterMeter[]>(water_meters.meters); // water meter
  const [shapes, setShapes] = useState<ShapesType>(Shapes);

  //console.log(`panelPos`, panelPos);
  //console.log(`meters`, meters);
  //console.log(`pipes`, pipes);
  //console.log(`supplies`, supplies);
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

  const handleSetPipePoints = (id: string, points: PipePoint[]) => {
    setPipes((prev) =>
      prev.map((pipe) => (pipe.id === id ? { ...pipe, points } : pipe))
    );
  };

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
  }, []);

  /* Handles Zoom and Pan */
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select(".zoom-layer");

    svg.call(
      d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 100]) // zoom range
        .on("zoom", (event) => {
          g.attr("transform", event.transform);
        })
    );
  }, []);

  // Draw Shape Components
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    // Clear or draw per shape type
    drawCircle(
      svg,
      shapes,
      setShapes,
      dimensions.width,
      dimensions.height,
      isModify,
      selectedComponents,
      setSelectedComponents
    );
  }, [shapes, dimensions, isModify, selectedComponents]);

  /* This used to zoom and grad whole pipe */
  /* useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    // Apply zoom behavior
    svg.call(
      d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([1e-5, 1e5])
        .on("zoom", (event) => {
          if (!selectedPipe) return;

          // Apply the transform to the pipe group
          svg
            .selectAll(`.pipe-group-${selectedPipe}`)
            .attr("transform", event.transform);

          // Extract translation
          const { x, y, k } = event.transform;

          // Get pipe points after transformation
          const pipeGroup = svg.selectAll<SVGGElement, unknown>(
            `.pipe-group-${selectedPipe}`
          );

          const points: { x: number; y: number }[] = [];
          pipeGroup.selectAll("polyline.pipe-inner").each(function () {
            const pl = this as SVGPolylineElement;
            const pts = pl.points;
            for (let i = 0; i < pts.numberOfItems; i++) {
              points.push({
                x: ((pts.getItem(i).x * k + x) / dimensions.width) * 100,
                y: ((pts.getItem(i).y * k + y) / dimensions.height) * 100,
              });
            }
          });

          // ✅ Log the points in a readable way
          console.log(`Pipe "${selectedPipe}" moved:`);
          points.forEach((p, i) => {
            console.log(
              `  Point ${i + 1}: x=${p.x.toFixed(4)}, y=${p.y.toFixed(4)}`
            );
          });
        })
    );
  }, [selectedPipe]); */

  /* ======================================================= */
  /*                   Handles Key Ctrls                     */
  /* ======================================================= */
  /* useEffect(() => {
    const keyControl = new KeyCntrls(
      () => selectedSupply,
      () => supplies,
      (id, updated) =>
        setSupplies((prev) => prev.map((s) => (s.id === id ? updated : s)))
    );

    return () => keyControl.destroy();
  }, [selectedSupply, supplies]); */

  // Draw pipes
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const pipesWithIds = pipes.map((pipe) => ({
      ...pipe,
      points: pipe.points.map((p, idx) => ({
        ...p,
        id: `${pipe.id}-pt${idx}`, // unique ID per point
      })),
    }));

    drawPipe(
      svg,
      pipesWithIds,
      (id, pipe) =>
        setPipes((prev) => prev.map((p) => (p.id === id ? pipe : p))),
      dimensions.width,
      dimensions.height,
      isModify,
      selectedComponents,
      setSelectedComponents
    );
  }, [pipes, dimensions, isModify, selectedComponents]);

  // Draw meters
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    drawWaterMeter(
      svg,
      meters,
      (id, meter) =>
        setMeters((prev) => prev.map((m) => (m.id === id ? meter : m))),
      dimensions.width,
      dimensions.height,
      isModify,
      selectedComponents,
      setSelectedComponents
    );
  }, [meters, dimensions, isModify, selectedComponents]);

  /* Draw Water Supply */
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    drawWaterSupply(
      svg,
      supplies,
      (id, supply) =>
        setSupplies((prev) => prev.map((s) => (s.id === id ? supply : s))),
      dimensions.width,
      dimensions.height,
      isModify,
      selectedComponents,
      setSelectedComponents
    );
  }, [supplies, dimensions, isModify, selectedComponents]);

  // Add new pipe dynamically
  const addPipe = () => {
    const pipeCount = pipes.length + 1; // next pipe number
    const newPipe = {
      id: `pipe${pipeCount}`,
      points: [
        { x: 20, y: 30 }, // start point

        { x: 50, y: 30 }, // end
      ],
    };

    // Append to pipes array
    setPipes((prev: typeof water_pipes.pipes) => [...prev, newPipe]);
  };

  // Add this inside your SCADAMap component

  // Duplicate selected pipe function
  const duplicatePipe = () => {
    if (!selectedPipe) return;

    const pipeToDuplicate = pipes.find((p) => p.id === selectedPipe);
    if (!pipeToDuplicate) return;

    const pipeCount = pipes.length + 1;
    const duplicatedPipe: PipeData = {
      id: `pipe${pipeCount}`,
      points: pipeToDuplicate.points.map((p) => ({
        x: p.x + 5, // small offset so it doesn't overlap
        y: p.y + 5,
      })),
    };

    setPipes((prev) => [...prev, duplicatedPipe]);
    setSelectedPipe(duplicatedPipe.id); // automatically select new pipe
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
  }, [selectedPipe, pipes]);

  // Handle click on canvas for placing new elements
  const handleSvgClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (selectedTool !== "pipe" || !selectedPipe) return;

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setPipes((prevPipes) =>
      prevPipes.map((pipe) =>
        pipe.id === selectedPipe
          ? { ...pipe, points: [...pipe.points, { x, y }] }
          : pipe
      )
    );
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
        className={`${isModify ? "" : "hidden"} backdrop-blur-md bg-white/20 border border shadow-lg rounded-md p-4 flex flex-col`}
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
        <g className="zoom-layer">
          <g className="grid-layer" />
          <g className="map-layer" />
        </g>
      </svg>
    </div>
  );
}
