import React from 'react';
import Svg, { Path, Circle, Polyline, Polygon, Line, Rect } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

const base = (size = 20, color = '#eef8f1') => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: color,
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export function LogoMarkIcon({ size, color }: IconProps) {
  return (
    <Svg {...base(size, color)}>
      <Path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <Path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <Path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </Svg>
  );
}

export function HomeIcon({ size, color }: IconProps) {
  return (
    <Svg {...base(size, color)}>
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <Polyline points="9 22 9 12 15 12 15 22" />
    </Svg>
  );
}

export function HistoryIcon({ size, color }: IconProps) {
  return (
    <Svg {...base(size, color)}>
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <Path d="M14 2v6h6" />
      <Line x1={8} y1={13} x2={16} y2={13} />
      <Line x1={8} y1={17} x2={16} y2={17} />
    </Svg>
  );
}

export function BudgetIcon({ size, color }: IconProps) {
  return (
    <Svg {...base(size, color)}>
      <Circle cx={12} cy={12} r={9} />
      <Circle cx={12} cy={12} r={5} />
      <Circle cx={12} cy={12} r={1} />
    </Svg>
  );
}

export function PlusIcon({ size, color }: IconProps) {
  return (
    <Svg {...base(size, color)} strokeWidth={2.5}>
      <Line x1={12} y1={5} x2={12} y2={19} />
      <Line x1={5} y1={12} x2={19} y2={12} />
    </Svg>
  );
}

export function LogoutIcon({ size, color }: IconProps) {
  return (
    <Svg {...base(size, color)}>
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <Polyline points="16 17 21 12 16 7" />
      <Line x1={21} y1={12} x2={9} y2={12} />
    </Svg>
  );
}

export function BackIcon({ size, color }: IconProps) {
  return (
    <Svg {...base(size, color)}>
      <Polyline points="15 18 9 12 15 6" />
    </Svg>
  );
}

export function MailIcon({ size, color }: IconProps) {
  return (
    <Svg {...base(size, color)}>
      <Path d="M22 6 12 13 2 6" />
      <Path d="M2 6h20v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z" />
    </Svg>
  );
}

export function LockIcon({ size, color }: IconProps) {
  return (
    <Svg {...base(size, color)}>
      <Rect x={3} y={11} width={18} height={10} rx={2} />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Svg>
  );
}

export function UserIcon({ size, color }: IconProps) {
  return (
    <Svg {...base(size, color)}>
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx={12} cy={7} r={4} />
    </Svg>
  );
}

export function EyeIcon({ size, color }: IconProps) {
  return (
    <Svg {...base(size, color)}>
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <Circle cx={12} cy={12} r={3} />
    </Svg>
  );
}

export function ArrowUpIcon({ size, color }: IconProps) {
  return (
    <Svg {...base(size, color)}>
      <Path d="M12 5v14M19 12l-7 7-7-7" />
    </Svg>
  );
}

export function TrashIcon({ size, color }: IconProps) {
  return (
    <Svg {...base(size, color)}>
      <Polyline points="3 6 5 6 21 6" />
      <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <Path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </Svg>
  );
}

export function SearchIcon({ size, color }: IconProps) {
  return (
    <Svg {...base(size, color)}>
      <Circle cx={11} cy={11} r={7} />
      <Path d="m21 21-4.3-4.3" />
    </Svg>
  );
}

export function ArrowDownIcon({ size, color }: IconProps) {
  return (
    <Svg {...base(size, color)}>
      <Path d="M12 19V5M5 12l7-7 7 7" />
    </Svg>
  );
}

const CATEGORY_PATHS: Record<string, React.ReactNode> = {
  Food: (
    <>
      <Path d="M3 2v7c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V2" />
      <Path d="M7 2v20" />
      <Path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </>
  ),
  Transport: (
    <>
      <Path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2" />
      <Circle cx={6.5} cy={16.5} r={2.5} />
      <Circle cx={16.5} cy={16.5} r={2.5} />
    </>
  ),
  Housing: (
    <>
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <Polyline points="9 22 9 12 15 12 15 22" />
    </>
  ),
  Utilities: <Polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
  Entertainment: (
    <>
      <Path d="M9 18V5l12-2v13" />
      <Circle cx={6} cy={18} r={3} />
      <Circle cx={18} cy={16} r={3} />
    </>
  ),
  Health: <Path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  Education: (
    <>
      <Path d="M22 10 12 5 2 10l10 5 10-5Z" />
      <Path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" />
    </>
  ),
  Shopping: (
    <>
      <Path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <Path d="M3 6h18" />
      <Path d="M16 10a4 4 0 0 1-8 0" />
    </>
  ),
};

const DEFAULT_CATEGORY_PATH = (
  <>
    <Rect x={2} y={7} width={20} height={14} rx={2} />
    <Path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2Z" />
    <Circle cx={16} cy={14} r={1} />
  </>
);

export function CategoryIcon({ category, size, color }: IconProps & { category: string }) {
  return <Svg {...base(size, color)}>{CATEGORY_PATHS[category] ?? DEFAULT_CATEGORY_PATH}</Svg>;
}
