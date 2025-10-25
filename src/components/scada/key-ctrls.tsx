/* Utility for behavior using keyboard key  */
export class KeyCntrls<T extends { id: string; x: number; y: number }> {
  private getSelectedId: () => string | null;
  private getItems: () => T[];
  private updateItem: (id: string, updated: T) => void;
  private moveStep: number;

  constructor(
    getSelectedId: () => string | null,
    getItems: () => T[],
    updateItem: (id: string, updated: T) => void,
    moveStep: number = 0.3
  ) {
    this.getSelectedId = getSelectedId;
    this.getItems = getItems;
    this.updateItem = updateItem;
    this.moveStep = moveStep;

    window.addEventListener("keydown", this.handleKeyMove);
  }

  handleKeyMove = (e: KeyboardEvent) => {
    const selectedId = this.getSelectedId();
    if (!selectedId) return;

    const items = this.getItems();
    const item = items.find((i) => i.id === selectedId);
    if (!item) return;

    let { x, y } = item;

    switch (e.key) {
      case "ArrowUp":
        y -= this.moveStep;
        break;
      case "ArrowDown":
        y += this.moveStep;
        break;
      case "ArrowLeft":
        x -= this.moveStep;
        break;
      case "ArrowRight":
        x += this.moveStep;
        break;
      default:
        return;
    }

    e.preventDefault();

    this.updateItem(item.id, { ...item, x, y });
  };

  destroy() {
    window.removeEventListener("keydown", this.handleKeyMove);
  }
}
