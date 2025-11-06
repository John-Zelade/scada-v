export type GaugeProps = {
  value: number; // 0 - 100
  size?: number;
  strokeWidth?: number;
  label?: string;
};

export type IconProps = {
  value: number;
  className?: string;
  width?: number | string;
  height?: number | string;
};
