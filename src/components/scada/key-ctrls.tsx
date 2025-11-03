import type { SelectedComponent, ShapesType } from "../types/map";

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
        // ✅ Case 1: Has multiple points (pipe, circle, etc.)
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

          (updated as any)[type] = (prev as any)[type]?.map((item: any) =>
            item.id === data.id ? { ...item, points: movedPoints } : item
          );

          newSelectedComponents.push({
            type,
            data: { ...data, points: movedPoints },
          });

          return;
        }

        // ✅ Case 2: Connection point — must update parent pipe
        if ("x" in data && "y" in data && data.id.includes("-pt")) {
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

          // Extract parent pipe ID from point ID (e.g., "pipe1-pt2" → "pipe1")
          const parentPipeId = data.id.split("-pt")[0];

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

  destroy() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
  }
}
