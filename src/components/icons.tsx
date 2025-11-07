// components/icons/WaterTankIcon.tsx
import React from "react";
import type { GaugeProps, IconProps } from "./types/icons";

export const WaterTankIcon: React.FC<IconProps> = ({
  value = 0,
  className = "",
  width = 4,
  height = 20,
}) => {
  // Determine battery status
  let batteryLabel = "N/A";
  let batteryBg = "bg-gray-200";
  let batteryBorder = "border-gray-400";
  let batteryText = "text-gray-700";

  // Water level status (colors and label)
  let levelLabel = "N/A";
  let levelBg = "bg-gray-200";
  let levelBorder = "border-gray-400";
  let levelText = "text-gray-700";
  let waterColor = "#29B6F6"; // default water color
  let waterTextColor = "text-[#29B6F6]"; // default text color

  if ((Number(value) || 0) < 20) {
    levelLabel = "Critical";
    levelBg = "bg-red-500";
    levelBorder = "border-red-800";
    levelText = "text-red-800";
    waterColor = "#3B82F6"; //waterColor = "#EF4444";
    waterTextColor = "text-red-500";
  } else if ((Number(value) || 0) < 50) {
    levelLabel = "Low";
    levelBg = "bg-yellow-400";
    levelBorder = "border-yellow-500";
    levelText = "text-yellow-800";
    waterColor = "#3B82F6"; //waterColor = "#FACC15";
    waterTextColor = "text-yellow-500";
  } else if ((Number(value) || 0) < 80) {
    levelLabel = "Normal";
    levelBg = "bg-blue-400";
    levelBorder = "border-blue-500";
    levelText = "text-blue-800";
    waterColor = "#3B82F6";
    waterTextColor = "text-blue-500";
  } else {
    levelLabel = "Critical";
    levelBg = "bg-red-500";
    levelBorder = "border-red-800";
    levelText = "text-red-800";
    waterColor = "#3B82F6"; //waterColor = "#EF4444";
    waterTextColor = "text-red-500";
  }

  return (
    <div className={`water-tank ${className}`}>
      {/* water tank top cover */}
      {/* === Tank Top === */}
      <div className="relative flex w-full justify-center">
        <div
          className="absolute bottom-0 h-[2px] w-[20%] rounded-t-md"
          style={{
            background: "linear-gradient(to bottom, #d9d9d9, #a6a6a6)",
            border: "1px solid #8c8c8c",
            boxShadow: "inset 0 1px 2px #ffffff80, 0 2px 4px #00000040",

            zIndex: 2,
          }}
        ></div>
        <div
          className="h-[4px] w-[10%]"
          style={{
            background: "linear-gradient(to bottom, #d9d9d9, #a6a6a6)",
            border: "1px solid #8c8c8c",
            position: "relative",
            top: "-2px",
            zIndex: 3,
          }}
        ></div>
      </div>

      {/* === Tank Body === */}
      <div
        className="relative flex justify-center overflow-hidden border"
        style={{
          borderRadius: "10% / 60%",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "#6b6b6b",
          height: `${height}px`,
          width: `100%`,
          background: `
      radial-gradient(circle at 35% 25%, #f9f9f9, transparent 45%),
      linear-gradient(145deg, #d0d0d0 0%, #e5e5e5 20%, #fdfdfd 40%, #cecece 60%, #a8a8a8 100%)
    `,
          boxShadow: `
      inset 0 6px 10px rgba(255,255,255,0.35),
      inset 0 -6px 10px rgba(0,0,0,0.25),
      0 2px 6px rgba(0,0,0,0.25)
    `,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* top horizontal reflection */}
        <div
          className="absolute top-0 left-0 h-[25%] w-full opacity-60"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,0.2), transparent)",
          }}
        ></div>

        {/* main vertical reflection (bright streak) */}
        <div
          className="absolute top-0 left-[20%] h-full w-[6%] opacity-35"
          style={{
            background:
              "linear-gradient(to right, rgba(255,255,255,0.8), rgba(255,255,255,0.05))",
            filter: "blur(1px)",
          }}
        ></div>

        {/* soft side reflection (right edge) */}
        <div
          className="absolute top-0 right-[10%] h-full w-[4%] opacity-25"
          style={{
            background:
              "linear-gradient(to left, rgba(255,255,255,0.5), transparent)",
            filter: "blur(1.5px)",
          }}
        ></div>

        {/* fine brushed steel lines for realism */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute top-0 h-full opacity-[0.07]"
            style={{
              left: `${i * 12}%`,
              width: "2%",
              background:
                "linear-gradient(to right, rgba(255,255,255,0.6), rgba(255,255,255,0))",
            }}
          ></div>
        ))}

        {/* Water wave - back */}
        <svg
          className="absolute bottom-0 left-0 z-0 opacity-40"
          width="100%"
          height={`${Number(value) || 0}%`}
          viewBox="0 0 1000 1000"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          fill={waterColor}
        >
          <defs>
            <path
              id="wavepath1"
              d="M 0 2000 0 500 Q 150 448 300 500 t 300 0 300 0 300 0 300 0 300 0 v1000 z"
            />
            <path id="motionpath1" d="M -600 0 0 0" />
          </defs>
          <g>
            <use xlinkHref="#wavepath1" y="-477">
              <animateMotion dur="6s" repeatCount="indefinite">
                <mpath xlinkHref="#motionpath1" />
              </animateMotion>
            </use>
          </g>
        </svg>

        {/* Water wave - front */}
        <svg
          className="absolute bottom-0 left-0 z-0 opacity-40"
          width="100%"
          height={`${Number(value) || 0}%`}
          viewBox="0 0 1000 1000"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          fill="#ffffff"
        >
          <defs>
            <path
              id="wavepath2"
              d="M 0 2000 0 500 Q 103 478 206 500 t 206 0 206 0 206 0 206 0 206 0 206 0  v1000 z"
            />
            <path id="motionpath2" d="M -412 0 0 0" />
          </defs>
          <g>
            <use xlinkHref="#wavepath2" y="-489" fill={waterColor}>
              <animateMotion dur="5s" repeatCount="indefinite">
                <mpath xlinkHref="#motionpath2" />
              </animateMotion>
            </use>
          </g>
        </svg>
        {/* === Percentage Text (Centered Above Water) === */}
        <div
          className="absolute z-10 text-[14px] font-semibold text-[#222]"
          style={{
            fontFamily: "Consolas, monospace",
            bottom: value > 90 ? "50%" : `${value + 5}%`,
            transform: "translateY(50%)",
          }}
        >
          {`${value.toFixed(2)}%`}
        </div>
      </div>
    </div>
  );
};

export const PressureTransmitterGauge: React.FC<GaugeProps> = ({
  value,
  size = 20,
}) => {
  const maxPSI = 300; // new max
  const tickCount = 24; // same as ticks
  const labelPSIs = [0, 25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275];
  const clampedValue = Math.max(0, Math.min(maxPSI, value));

  const angle = -180 + (clampedValue / maxPSI) * 360;

  const color =
    clampedValue < 80
      ? "#E53935" // low pressure
      : clampedValue < 160
        ? "#E53935" //"#FDD835" // mid pressure
        : "#E53935"; //"#00C853"; // high pressure

  return (
    <div className="pressure-gauge">
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{ filter: "drop-shadow(0 1px 1px #000)" }}
      >
        {/* === Gradients === */}
        <defs>
          <radialGradient id="metal" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#dddddd" />
            <stop offset="50%" stopColor="#aaaaaa" />
            <stop offset="75%" stopColor="#666666" />
            <stop offset="100%" stopColor="#333333" />
          </radialGradient>

          <radialGradient id="face" cx="50%" cy="50%" r="65%">
            <stop offset="60%" stopColor="#ffffffff" />
            <stop offset="100%" stopColor="#4f4e4eff" />
          </radialGradient>
        </defs>

        {/* === Outer Ring === */}
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="url(#metal)"
          stroke="#2f2e2eff"
          strokeWidth="1"
        />

        {/* === Gauge Face === */}
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="url(#face)"
          stroke="#474646ff"
          strokeWidth="0.5"
        />

        {/* === Tick Marks (every 20 PSI) === */}
        {[...Array(tickCount)].map((_, i) => {
          const tickAngle = -90 + (i * 360) / tickCount; // 0–240 PSI split into 12 divisions
          const innerRadius = 35; // shorter tick start
          const outerRadius = 39; // shorter tick end (previously 40–44)

          const x1 = 50 + innerRadius * Math.cos((tickAngle * Math.PI) / 180);
          const y1 = 50 + innerRadius * Math.sin((tickAngle * Math.PI) / 180);
          const x2 = 50 + outerRadius * Math.cos((tickAngle * Math.PI) / 180);
          const y2 = 50 + outerRadius * Math.sin((tickAngle * Math.PI) / 180);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#333"
              strokeWidth={i % 2 === 0 ? 1.6 : 1}
            />
          );
        })}

        {/* === Tick Labels (every 40 PSI) === */}
        {labelPSIs.map((psi, i) => {
          const labelAngle = -270 + (psi / maxPSI) * 360;
          const x = 50 + 30 * Math.cos((labelAngle * Math.PI) / 180);
          const y = 50 + 30 * Math.sin((labelAngle * Math.PI) / 180) + 3;
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              fontSize="6"
              fill="#222"
              fontWeight="600"
              style={{ fontFamily: "Consolas, monospace" }}
            >
              {psi}
            </text>
          );
        })}

        {/* === Needle === */}
        <g
          transform={`rotate(${angle} 50 50)`}
          style={{
            transition: "transform 0.5s ease-in-out", // adjust duration and easing as needed
          }}
        >
          <polygon
            points="50,15 48.5,50 51.5,50" // tip at top, base near center
            fill={color}
          />
        </g>

        {/* === Center Bolt === */}
        <circle
          cx="50"
          cy="50"
          r="3"
          fill="#222"
          stroke="#555"
          strokeWidth="0.8"
        />

        {/* === Value Text (PSI) === */}
        <text
          x="50"
          y="65"
          textAnchor="middle"
          fontSize="8"
          fill="#222"
          fontWeight="600"
          style={{ fontFamily: "Consolas, monospace" }}
        >
          {clampedValue.toFixed(1)} PSI
        </text>
      </svg>
    </div>
  );
};
