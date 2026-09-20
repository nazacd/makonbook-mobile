import Svg, { Circle, Rect } from 'react-native-svg';

type CalculatorIconProps = {
  size?: number;
  color?: string;
};

export function CalculatorIcon({ size = 22, color = '#ffffff' }: CalculatorIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={4} y={2} width={16} height={20} rx={2} stroke={color} strokeWidth={2} />
      <Rect x={6.5} y={4.5} width={11} height={4} rx={1} stroke={color} strokeWidth={2} />
      <Circle cx={7.5} cy={13} r={1} fill={color} />
      <Circle cx={12} cy={13} r={1} fill={color} />
      <Circle cx={16.5} cy={13} r={1} fill={color} />
      <Circle cx={7.5} cy={17} r={1} fill={color} />
      <Circle cx={12} cy={17} r={1} fill={color} />
      <Circle cx={16.5} cy={17} r={1} fill={color} />
    </Svg>
  );
}
