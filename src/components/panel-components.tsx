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
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";

type Props = {
  setshowElements?: (value: boolean) => void;
  showElements: boolean;
};

export function PanelComponents({
  setshowElements,
  showElements = true,
}: Props) {
  const [expanded, setExpanded] = useState({
    shapes: true,
    mechanical: true,
    electrical: true,
  });

  const toggle = (key: keyof typeof expanded) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const categories = [
    {
      name: "Basic Shapes",
      key: "shapes",
      items: [
        { name: "Circle", icon: <Circle className="h-4 w-4 text-blue-500" /> },
        {
          name: "Rectangle",
          icon: <Square className="h-4 w-4 text-green-500" />,
        },
        { name: "Line", icon: <LineChart className="h-4 w-4 text-gray-500" /> },
        { name: "Label", icon: <Type className="h-4 w-4 text-orange-500" /> },
      ],
    },
    {
      name: "Mechanical Components",
      key: "mechanical",
      items: [
        { name: "Valve", icon: <Droplets className="h-4 w-4 text-sky-500" /> },
        { name: "Pump", icon: <Gauge className="h-4 w-4 text-cyan-600" /> },
        { name: "Motor", icon: <Zap className="h-4 w-4 text-yellow-500" /> },
      ],
    },
    {
      name: "Electrical Components",
      key: "electrical",
      items: [
        { name: "Sensor", icon: <Cpu className="h-4 w-4 text-purple-500" /> },
        {
          name: "Switch",
          icon: <SwitchCamera className="h-4 w-4 text-emerald-500" />,
        },
      ],
    },
  ];

  return (
    <div className="relative flex w-full flex-col md:col-span-5">
      {/* Toggle Button - Floating Left Edge */}
      <div
        onClick={() => setshowElements?.(!showElements)}
        className="absolute -right-[25px] top-2 z-50 flex rounded-r-sm bg-primary p-[5px] cursor-pointer hover:bg-primary/80 transition"
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
                <div className="ml-4 mt-1 grid grid-cols-2 gap-2">
                  {category.items.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center gap-2 rounded-md border p-2 hover:bg-muted cursor-pointer transition text-xs font-medium"
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </ScrollArea>
      </Card>
    </div>
  );
}
