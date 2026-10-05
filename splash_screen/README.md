# Mended splash animation

**Concept:** the Mended band draws itself in one smooth clockwise stroke, starting at the top of the seam. The seam stays open the whole time. "Mended" then fades up beneath it.

## Files

| File | Use |
|---|---|
| `mended_splash.json` | Lottie animation with a transparent background. Put it on a Warm Ivory (#F7F5F1) view. **Use this one in the app.** |
| `mended_splash_ivory-bg.json` | The same animation with the Ivory background built in, for players that can't set a background. |
| `mended_splash_preview_1080x1920.mp4` | Phone-size preview for review and sharing. It was rendered with lottie-web, the same engine the apps use. |
| `mended_splash_end-frame_1080x1920.png` | The final frame as a still image. |

## Specs

- **Canvas and speed:** 600 × 600 vector canvas at 60 fps. Total length is 120 frames (2.0 s).
- **Timeline (v2, smoothed):**
  - 0 to 0.5 s: the band fades in as it starts drawing, so there's no hard pop
  - 0.03 to 1.33 s: the band draws on, moving from the first frame and slowing gently into the seam
  - 0 to 1.67 s: the whole symbol settles from 94% to 100% scale
  - 1.1 to 1.8 s: the wordmark fades in and rises 16 px
  - 1.87 s: everything at rest; held until 2.0 s
- **Easing:**
  - Draw: (0.30, 0.15, 0.20, 1)
  - Fades: (0.30, 0, 0.30, 1)
  - Settle and rise: (0.25, 0.6, 0.30, 1)
- **Markers:** frame 80 is "band complete". Frame 112 is "logo complete, safe to hand off". The app can move to the first screen at frame 112 if loading is already done.
- **Preview video:** 0.3 s of blank Ivory before the animation and a 1 s hold at the end, so the video doesn't cut off. The Lottie file itself is still 2.0 s.
- **Colors:** Deep Amethyst #4B2A5A (band) and Ink Plum #241A2B (wordmark). The wordmark is Inter SemiBold, converted to shapes, so no font files are needed.

## Integration notes

- **Show Ivory before the animation starts:**
  - **iOS:** set the native launch screen (LaunchScreen storyboard) to a plain Warm Ivory background, then play the Lottie in the first view controller with lottie-ios.
  - **Android 12 and later:** set the system splash screen's background to Warm Ivory with a blank icon. Then play the Lottie in the first activity with lottie-android.
  - This way the user sees Ivory, then the logo drawing, with no flash between them.
- **Play it once.** Don't loop the animation.
- **Skip it when the app resumes.** Only play it on a cold launch (when the app starts fresh).
- **Respect Reduce Motion.** If the user has turned on Reduce Motion, jump straight to the last frame (or the end-frame PNG).
- **Draw-on technique:** the drawing effect is a trimmed ring used as an alpha matte over the exact logo shape. That means the finished frame matches the brand-kit logo exactly.
