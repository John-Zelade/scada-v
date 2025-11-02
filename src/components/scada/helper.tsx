import type { SelectedComponent } from "../types/map";

export function isSelected(
  selected: SelectedComponent[],
  id: string,
  type: SelectedComponent["type"]
): boolean {
  return selected.some((item) => item.data.id === id && item.type === type);
}
