import { useState } from "react";
import {
  Circle,
  Square,
  LineChart,
  Droplets,
  Gauge,
  Zap,
  Cpu,
  SwitchCamera,
  Type,
  PanelLeftClose,
  PanelRightClose,
  ChevronDown,
  ChevronRight,
  Slash,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { categories } from "@/lib/mock-data/panel-comp";
import { Card } from "@/components/ui/card";
import type { ShapesType } from "./types/map";

type Props = {
  modifiedShapes: ShapesType[];
  setModifiedShapes: React.Dispatch<React.SetStateAction<ShapesType[]>>;

  shapes: ShapesType;
  setShapes: React.Dispatch<React.SetStateAction<ShapesType>>;

  isModify: boolean;
  setshowElements: (value: boolean) => void;
  showElements: boolean;
};

export function PanelComponents({
  modifiedShapes,
  setModifiedShapes,

  shapes,
  setShapes,

  isModify,

  setshowElements,
  showElements = true,
}: Props) {
  const [expanded, setExpanded] = useState({
    shapes: true,
    mechanical: true,
    electrical: true,
  });

  /* This handles updating elements data */
  function handleShapeUpdate(newShapes: ShapesType) {
    setModifiedShapes((prev: ShapesType[]) => [...prev, newShapes]);
    setShapes(newShapes);
  }

  const toggle = (key: keyof typeof expanded) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="relative flex w-full flex-col md:col-span-5">
      {/* Toggle Button - Floating Left Edge */}
      <div
        onClick={() => setshowElements?.(!showElements)}
        className="absolute -right-[25px] top-8 z-50 flex rounded-r-sm bg-primary p-[5px] cursor-pointer hover:bg-primary/80 transition"
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="grid place-items-center text-white h-5 w-4">
                {showElements ? (
                  <PanelRightClose className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>{showElements ? "Hide Elements" : "Show Elements"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* SCADA Sidebar */}
      <Card className="rounded-none border-0 shadow-none p-0  bg-card/70 backdrop-blur-sm">
        <ScrollArea className="h-screen px-3 py-2">
          <div className="mb-3 text-xs font-semibold text-muted-foreground uppercase">
            Elements
          </div>

          {/* Collapsible Category Sections */}
          {categories.map((category) => (
            <div key={category.key} className="mb-3">
              <div
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1 hover:bg-muted"
                onClick={() => toggle(category.key as keyof typeof expanded)}
              >
                {expanded[category.key as keyof typeof expanded] ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-xs font-semibold text-foreground">
                  {category.name}
                </span>
              </div>

              {expanded[category.key as keyof typeof expanded] && (
                <div className="ml-4 mt-1 flex gap-2">
                  <TooltipProvider>
                    {category.items.map((item) => (
                      <Tooltip>
                        <TooltipTrigger className="cursor-pointer" asChild>
                          <div
                            key={item.name}
                            className="items-center gap-2 rounded-md text-gray-600 p-2 hover:bg-muted cursor-pointer transition text-xs font-medium"
                          >
                            {item.icon}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          {item.name}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                </div>
              )}
            </div>
          ))}
        </ScrollArea>
      </Card>
    </div>
  );
}
