export const placementImages: Record<string, any> = {
  math_20: require('@/assets/images/placement/math_20.jpg'),
  math_28: require('@/assets/images/placement/math_28.jpg'),
  math_30: require('@/assets/images/placement/math_30.jpg'),
};

export function resolvePlacementImage(key: string | null): any | null {
  if (!key) return null;
  return placementImages[key] ?? null;
}
