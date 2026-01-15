# Theme Implementation Plan

## Goal: Add 5 new themes to the app

### Steps:
1. ✅ Plan and analyze codebase
2. ✅ Update `src/index.css` with 5 new theme CSS variables
3. ✅ Create `src/hooks/useTheme.tsx` theme provider
4. ✅ Update `src/App.tsx` to use ThemeProvider
5. ✅ Update `src/components/Header.tsx` with theme selector dropdown
6. ⬜ Fix `src/components/ui/sonner.tsx` theme import (optional - next-themes not used)
7. ⬜ Test the implementation (manual)

### 5 New Themes Added:
1. **Ocean** - Deep blues and teals
2. **Forest** - Greens and earth tones
3. **Sunset** - Warm pinks, oranges, purples
4. **Midnight** - Deep navies and purples
5. **Lavender** - Soft violets and purples

### Existing Themes (preserved):
- Default Light (Warm ivory/saffron)
- Default Dark (Deep charcoal/saffron)

## Features:
- Theme selector dropdown in header
- Light/Dark mode toggle
- Theme persistence in localStorage
- Mobile-friendly theme selector
- All themes support both light and dark modes

