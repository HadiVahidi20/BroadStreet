# Player Images Directory

## Required Images

This directory should contain the following images for the player cards on the Teams page:

### 1. `player_headshot.png`
- **Purpose**: Individual player photo (foreground layer)
- **Recommended specs**:
  - Format: PNG with transparent background
  - Dimensions: 400px width × 500px height (4:5 aspect ratio)
  - Resolution: 72-150 DPI
  - File size: < 200KB (optimized)
- **Content**: Full-body or upper-body shot of player in club kit
- **Important**: Should have transparent background so it overlays nicely on the background pattern

### 2. `player-bg.png`
- **Purpose**: Background pattern with club logo (background layer)
- **Recommended specs**:
  - Format: PNG
  - Dimensions: 400px width × 500px height minimum
  - Resolution: 72-150 DPI
  - File size: < 150KB (optimized)
- **Content**: Club logo pattern or branded background design
- **Tip**: Can be a subtle pattern that doesn't distract from player photo

## Current Implementation

Currently, **all player cards use the same images** from this directory. This is by design for the initial setup.

### To customize individual players:

1. Create individual player photo files (e.g., `tom_roberts.png`, `dan_mitchell.png`)
2. Update the `src` attribute in `pages/teams.html` for each player card
3. Example:
   ```html
   <img src="../assets/photos/player_headshot/tom_roberts.png" alt="Tom Roberts" class="player-card-photo">
   ```

## CSS Effects

The player cards have a 3D hover effect:
- **Background layer**: Zooms in (scale 1.15) on hover
- **Player photo**: Lifts up with slight 3D rotation on hover
- **Gradient overlay**: Adds depth to the bottom of the card

## Image Optimization Tips

1. Use PNG format for player photos (transparent background)
2. Compress images using tools like TinyPNG or ImageOptim
3. Ensure consistent lighting across all player photos
4. Keep file sizes under 200KB for fast page load times

## File Paths

Make sure the images are in this exact location:
- `assets/photos/player_headshot/player_headshot.png`
- `assets/photos/player_headshot/player-bg.png`
