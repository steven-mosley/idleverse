# Idleverse UI Components

This directory contains UI components for the Idleverse game.

## EnhancedDashboard.js

The `EnhancedDashboard` component provides an improved user interface for game statistics, character management, and world information.

### Features:
- **Tabbed Interface**: Organized into Character, Stats, World, Map, and Settings tabs
- **Collapsible Design**: Can be minimized to free up screen space
- **Visual Feedback**: Status bars, resource visualization, and attribute displays
- **Character Management**: View character attributes, status, and needs
- **World Information**: Resource distribution, nearby resources, and world statistics
- **Detailed Map**: Enhanced mini-map for world navigation
- **Settings Control**: Toggle auto-gathering and other game preferences

### Usage:
```jsx
import EnhancedDashboard from './UI/EnhancedDashboard';

// In component render:
<EnhancedDashboard character={characterData} />
```

### Props:
- `character`: Character data object containing position, attributes, inventory, etc.

### Dependencies:
- Uses the game store via `useGameStore` for accessing resources, world time, etc.
- Requires socket connection for settings synchronization (auto-gathering toggle)

## Customization

The dashboard uses inline styles for easy integration. Colors and visual elements can be customized by editing the component.

Key customization points:
- `getResourceColor` function determines resource type colors
- `resourceTypeNames` and `attributeFullNames` for display labels
- Tab ordering and content in the render methods

## Original Dashboard

The original `Dashboard.js` component is still available but is superseded by `EnhancedDashboard.js`.
