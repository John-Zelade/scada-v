import type { SelectedComponent, ShapesType } from "../types/map";
import * as d3 from "d3";

export class KeyCntrls {
  private getSelected: () => SelectedComponent[];
  private setElements: React.Dispatch<React.SetStateAction<ShapesType>>;
  private moveStep: number;
  private updateSelected?: React.Dispatch<
    React.SetStateAction<SelectedComponent[]>
  >;
  private pressedKeys: Set<string> = new Set();
  private animationFrame: number | null = null;
  private canMove: () => boolean; //callback to check if movement allowed

  constructor(
    getSelected: () => SelectedComponent[],
    setElements: React.Dispatch<React.SetStateAction<ShapesType>>,
    moveStep: number = 1,
    updateSelected?: React.Dispatch<React.SetStateAction<SelectedComponent[]>>,
    canMove: () => boolean = () => true // default allow movement
  ) {
    this.getSelected = getSelected;
    this.setElements = setElements;
    this.moveStep = moveStep;
    this.updateSelected = updateSelected;
    this.canMove = canMove;

    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);

    this.loop(); // start animation loop
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    // Select All (Ctrl + A or Cmd + A)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
      e.preventDefault(); // prevent browser "select all" text
      if (this.canMove()) {
        //check if modify allowed
        this.selectAll();
      }
      return;
    }

    // Straighten pipe (Ctrl + L)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") {
      e.preventDefault();
      this.straightenSelectedPipes();
      return;
    }

    /*Move selected element using Arrow key  */
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      this.pressedKeys.add(e.key);
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.pressedKeys.delete(e.key);
  };

  private loop = () => {
    if (this.canMove() && this.pressedKeys.size > 0) {
      this.pressedKeys.forEach((key) => this.moveOnce(key));
    }
    this.animationFrame = requestAnimationFrame(this.loop);
  };

  private moveOnce(key: string) {
    const moveStep = this.moveStep;
    const selected = this.getSelected();
    if (selected.length === 0) return;

    this.setElements((prev) => {
      const updated = { ...prev };
      const newSelectedComponents: SelectedComponent[] = [];

      selected.forEach(({ data, type }) => {
        //console.log(`key ctrl data: `, data);

        //Has multiple points (pipe)
        if ("points" in data && Array.isArray(data.points)) {
          const movedPoints = data.points.map((p) => {
            switch (key) {
              case "ArrowUp":
                return { ...p, y: p.y - moveStep };
              case "ArrowDown":
                return { ...p, y: p.y + moveStep };
              case "ArrowLeft":
                return { ...p, x: p.x - moveStep };
              case "ArrowRight":
                return { ...p, x: p.x + moveStep };
              default:
                return p;
            }
          });

          (updated as any)[type] = (updated as any)[type]?.map((item: any) =>
            item.id === data.id ? { ...item, points: movedPoints } : item
          );

          newSelectedComponents.push({
            type,
            data: { ...data, points: movedPoints },
          });

          return;
        }

        //Connection point — selected connection point
        if ("x" in data && "y" in data && data.id.includes("connection-pt")) {
          let newX = data.x;
          let newY = data.y;

          switch (key) {
            case "ArrowUp":
              newY -= moveStep;
              break;
            case "ArrowDown":
              newY += moveStep;
              break;
            case "ArrowLeft":
              newX -= moveStep;
              break;
            case "ArrowRight":
              newX += moveStep;
              break;
          }

          // Extract parent pipe ID from point ID (e.g., "pipe1-connection-pt2" → "pipe1")
          const parentPipeId = data.id.split("-connection-pt")[0];

          // Update that pipe’s corresponding point
          (updated as any).pipe = (prev as any).pipe.map((pipe: any) => {
            if (pipe.id !== parentPipeId) return pipe;
            return {
              ...pipe,
              points: pipe.points.map((pt: any) =>
                pt.id === data.id ? { ...pt, x: newX, y: newY } : pt
              ),
            };
          });

          newSelectedComponents.push({
            type,
            data: { ...data, x: newX, y: newY },
          });

          return;
        }

        console.log("❌ Unknown data type:", data);
      });

      this.updateSelected?.(newSelectedComponents);
      return updated;
    });
  }

  private selectAll() {
    if (!this.updateSelected) return;

    this.setElements((prev) => {
      const all: SelectedComponent[] = [];

      (Object.entries(prev) as [keyof ShapesType, any[]][]).forEach(
        ([type, items]) => {
          if (!Array.isArray(items)) return;
          (items as any[]).forEach((item) => {
            all.push({ type: type as SelectedComponent["type"], data: item });
          });
        }
      );

      //Check if everything is already selected
      const isAllSelected =
        this.getSelected() &&
        all.length > 0 &&
        all.every((a) =>
          this.getSelected().some(
            (b) => b.type === a.type && b.data.id === a.data.id
          )
        );

      this.updateSelected?.(isAllSelected ? [] : all);
      return prev;
    });
  }

  private straightenSelectedPipes() {
    const selected = this.getSelected();
    if (selected.length === 0) return;

    this.setElements((prev) => {
      const updated = { ...prev };

      selected.forEach(({ data, type }) => {
        if (type !== "pipe" || !("points" in data)) return;

        const points = data.points;
        if (points.length < 2) return;

        // Get the first and last point
        const [start, end] = [points[0], points[points.length - 1]];

        // Compute equally spaced straight line between them
        const newPoints = points.map((_, i) => {
          const t = i / (points.length - 1);
          return {
            ..._,
            x: start.x + (end.x - start.x) * t,
            y: start.y + (end.y - start.y) * t,
          };
        });

        (updated as any).pipe = (prev as any).pipe.map((p: any) =>
          p.id === data.id ? { ...p, points: newPoints } : p
        );
      });

      return updated;
    });
  }

  destroy() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
  }
}

export function enableBoxSelection(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  elements: ShapesType,
  setSelectedComponents: React.Dispatch<
    React.SetStateAction<SelectedComponent[]>
  >
) {
  let startX = 0;
  let startY = 0;
  let selectionBox: d3.Selection<
    SVGRectElement,
    unknown,
    null,
    undefined
  > | null = null;
  let isDragging = false;

  const svgNode = svg.node();

  const clearSelection = () => {
    if (selectionBox) {
      selectionBox.remove();
      selectionBox = null;
    }
    isDragging = false;
    document.body.style.userSelect = "auto";
  };

  svg
    .on("mousedown", (event: MouseEvent) => {
      if (event.button !== 0) return; // only left-click

      event.preventDefault();
      document.body.style.userSelect = "none";
      isDragging = true;

      const rect = svgNode?.getBoundingClientRect();
      startX = event.clientX - (rect?.left ?? 0);
      startY = event.clientY - (rect?.top ?? 0);
      // create a visual selection rectangle
      selectionBox = svg
        .append("rect")
        .attr("x", startX)
        .attr("y", startY)
        .attr("width", 0)
        .attr("height", 0)
        .attr("fill", "rgba(0, 150, 255, 0.2)")
        .attr("stroke", "#0096ff")
        .attr("stroke-dasharray", "4 2");
    })
    .on("mousemove", (event: MouseEvent) => {
      if (!isDragging || !selectionBox) return;

      const rect = svgNode?.getBoundingClientRect();
      const currentX = event.clientX - (rect?.left ?? 0);
      const currentY = event.clientY - (rect?.top ?? 0);

      const rectX = Math.min(startX, currentX);
      const rectY = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);

      selectionBox
        .attr("x", rectX)
        .attr("y", rectY)
        .attr("width", width)
        .attr("height", height);
    })
    .on("mouseup", (event: MouseEvent) => {
      if (!isDragging || !selectionBox) return;
      isDragging = false;

      const box = selectionBox.node()?.getBBox();
      if (!box) {
        clearSelection();
        return;
      }

      const svgWidth = svgNode?.clientWidth || 0;
      const svgHeight = svgNode?.clientHeight || 0;

      // detect elements inside box
      const selected: SelectedComponent[] = [];

      Object.entries(elements).forEach(([type, items]) => {
        if (!Array.isArray(items)) return;

        items.forEach((item: any) => {
          const { x, y, points } = item;

          if (points && Array.isArray(points)) {
            // For pipes (with multiple points)

            const inside = points.some((p) => {
              const px = (p.x / 100) * svgWidth;
              const py = (p.y / 100) * svgHeight;

              return (
                px >= box.x &&
                px <= box.x + box.width &&
                py >= box.y &&
                py <= box.y + box.height
              );
            });

            if (inside)
              selected.push({
                type: type as SelectedComponent["type"],
                data: item,
              });
          } else if (x !== undefined && y !== undefined) {
            // For elements with single x/y (also in percent)
            const px = (x / 100) * svgWidth;
            const py = (y / 100) * svgHeight;

            if (
              px >= box.x &&
              px <= box.x + box.width &&
              py >= box.y &&
              py <= box.y + box.height
            ) {
              selected.push({
                type: type as SelectedComponent["type"],
                data: item,
              });
            }
          }
        });
      });

      setSelectedComponents(selected);

      // remove rectangle
      selectionBox.remove();
      selectionBox = null;
    });
}
