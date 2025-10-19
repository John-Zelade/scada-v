import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { drawPipe, drawWaterMeter } from "./scada-components";
import water_flow from "../../assets/water-flow.png";
import { scadaDraw } from "./scada-draw";
import { drawGrid } from "./utill";
import { handleMouseDown, handleMouseMove, handleMouseUp } from "./utill";
import type { WaterMeter } from "../types/map";

// Types
interface PipePoint {
  x: number;
  y: number;
}

interface PipeData {
  [key: string]: PipePoint[];
}

interface SCADAMapProps {
  isModify: boolean;
  width?: number;
  height?: number;
}

type ToolType = "pipe" | "tank" | "meter" | null;

export function SCADAMap({
  isModify,
  width = 600,
  height = 400,
}: SCADAMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasMapRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width, height });
  // 🟩 Tool panel position (movable)
  const [panelPos, setPanelPos] = useState({
    x: 89.7, // 90%
    y: 1, // 90%
  });

  console.log(`panelPos`, panelPos);

  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const [selectedTool, setSelectedTool] = useState<ToolType>(null);

  const [selectedPipe, setSelectedPipe] = useState<string | null>(null);
  // Pipes stored data
  const [pipes, setPipes] = useState<PipeData>({
    pipe1: [
      { x: 26.1095, y: 25.7819 },
      { x: 31.4022, y: 25.9022 },
      { x: 31.4313, y: 28.2692 },
      { x: 36.6374, y: 28.4273 },
    ],

    pipe2: [
      { x: 39.2289, y: 28.5486 },
      { x: 46.1591, y: 28.5485 },
    ],
  });

  const [meters, setMeters] = useState<WaterMeter[]>([
    {
      x: 37.95629999906325,
      y: 28.42725849837708,
      id: "Meter1",
    },
  ]);
  const [selectedMeter, setSelectedMeter] = useState<string | null>(null);
  console.log(`meters`, meters);

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

  // Handle resizing
  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const cw = containerRef.current.clientWidth;
      const ar = height / width;
      setDimensions({ width: cw, height: cw * ar });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [width, height]);

  const handleSetPipePoints = (id: string, points: PipePoint[]) => {
    setPipes((prev) => ({ ...prev, [id]: points }));
  };

  /* Handles display grid layout */
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    drawGrid(svg, dimensions);
  }, [dimensions]);

  /* Handles Components Dragging and Zoom */
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    // Remove previous zoom handlers
    svg.on(".zoom", null);

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
  }, [selectedPipe]);

  // Draw pipes
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    Object.entries(pipes).forEach(([name, points]) => {
      drawPipe(
        isModify,
        svg,
        points,
        handleSetPipePoints,
        dimensions.width,
        dimensions.height,
        name,
        selectedPipe,
        setSelectedPipe
      );
    });

    // Draw meters
    drawWaterMeter(
      svg,
      meters,
      (id, meter) =>
        setMeters((prev) => prev.map((m) => (m.id === id ? meter : m))),
      dimensions.width,
      dimensions.height,
      selectedMeter,
      setSelectedMeter,
      isModify
    );
  }, [pipes, meters, dimensions, selectedPipe, selectedTool, isModify]);

  // Add new pipe dynamically
  const addPipe = () => {
    const pipeCount = Object.keys(pipes).length;
    const newPipeName = `pipe${pipeCount + 1}`;

    const newPipePoints = [
      { x: 20 + pipeCount, y: 30 }, // left point
      { x: 35 + pipeCount, y: 30 }, // middle point
      { x: 50 + pipeCount, y: 30 }, // right point
    ];

    setPipes((prev) => ({
      ...prev,
      [newPipeName]: newPipePoints,
    }));
  };

  // Handle click on canvas for placing new elements
  const handleSvgClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!selectedTool || selectedTool !== "pipe") return;
    if (!selectedPipe) return; // only add if a specific pipe is selected

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    //Update the selected pipe within the object
    setPipes((prev) => ({
      ...prev,
      [selectedPipe]: [...(prev[selectedPipe] || []), { x, y }],
    }));
  };

  /*useEffect(() => {
    redrawScadaCanvas();
  }, [dimensions]);

  function redrawScadaCanvas() {
    const canvas = canvasMapRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: w, height: h } = dimensions;
    canvas.width = w;
    canvas.height = h;
    ctx.save();
    scadaDraw({ canvas, ctx, dimensions });

    ctx.restore();
  }*/

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        //backgroundImage: `url(${water_flow})`, // your guide image
        //backgroundSize: "contain", // or "cover" depending on your needs
        //backgroundPosition: "center",
        //backgroundRepeat: "no-repeat",
      }}
    >
      {/*  <canvas
        className=""
        ref={canvasMapRef}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    */}

      {/* === Tool Panel === */}
      <div
        className={`backdrop-blur-md bg-white/20 border border shadow-lg rounded-md p-4 flex flex-col`}
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
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        onClick={(event) => {
          handleSvgClick(event);
          setSelectedPipe(null);
        }}
        style={{
          display: "block",
        }}
      />
    </div>
  );
}
