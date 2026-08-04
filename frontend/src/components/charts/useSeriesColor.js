import { useTheme } from '../../hooks/useTheme';
import { SERIES_COLOR, CATEGORICAL_THEME } from './chartColors';

// Resolves the theme-appropriate chart color tokens so callers don't each
// have to pull `theme` out of useTheme() and index into SERIES_COLOR/
// CATEGORICAL_THEME by hand. `color` keeps the old flat-object shape
// (color.ocean, color.success, ...) so call sites that already destructure
// it that way don't need to change beyond the import.
export function useSeriesColor() {
  const { theme } = useTheme();
  return {
    color: SERIES_COLOR[theme],
    categorical: CATEGORICAL_THEME[theme],
  };
}
