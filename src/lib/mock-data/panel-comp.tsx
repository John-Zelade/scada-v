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
import { PressureTransmitterGauge, WaterTankIcon } from "@/components/icons";

export const categories = [
  {
    name: "Basic Shapes",
    key: "shapes",
    items: [
      { name: "Circle", icon: <Circle className="h-4 w-4 0" /> },
      {
        name: "Rectangle",
        icon: <Square className="h-4 w-4 " />,
      },
      { name: "Line", icon: <Slash className="h-4 w-4 " /> },
    ],
  },
  {
    name: "SCADA Water",
    key: "scada-water",
    items: [
      { name: "Tank", icon: <WaterTankIcon value={""} className="h-3 w-8" /> },
      { name: "Pressure", icon: <PressureTransmitterGauge value={120} /> },
    ],
  },
  {
    name: "Mechanical Components",
    key: "mechanical",
    items: [
      { name: "Valve", icon: <Droplets className="h-4 w-4 " /> },
      { name: "Pump", icon: <Gauge className="h-4 w-4 " /> },
      { name: "Motor", icon: <Zap className="h-4 w-4 " /> },
    ],
  },
  {
    name: "Electrical Components",
    key: "electrical",
    items: [
      { name: "Sensor", icon: <Cpu className="h-4 w-4 " /> },
      {
        name: "Switch",
        icon: <SwitchCamera className="h-4 w-4 " />,
      },
    ],
  },
];
