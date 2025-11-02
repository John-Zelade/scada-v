import { useState } from "react";

export function useUndoRedo<T>(initialValue: T) {
  const [history, setHistory] = useState<T[]>([initialValue]);
  const [index, setIndex] = useState(0);

  const set = (newState: T) => {
    const newHistory = history.slice(0, index + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (index > 0) setIndex(index - 1);
  };

  const redo = () => {
    if (index < history.length - 1) setIndex(index + 1);
  };

  return {
    state: history[index],
    set,
    undo,
    redo,
    history,
  };
}
