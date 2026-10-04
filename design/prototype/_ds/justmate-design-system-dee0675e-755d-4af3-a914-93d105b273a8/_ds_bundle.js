/* @ds-bundle: {"format":4,"namespace":"JustMateDesignSystem_dee067","components":[{"name":"BUCKETS","sourcePath":"components/compass/BucketLabel.jsx"},{"name":"BucketLabel","sourcePath":"components/compass/BucketLabel.jsx"},{"name":"CompassDial","sourcePath":"components/compass/CompassDial.jsx"},{"name":"Countdown","sourcePath":"components/compass/Countdown.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"ICONS","sourcePath":"components/core/Icon.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Badge","sourcePath":"components/display/Badge.jsx"},{"name":"Card","sourcePath":"components/display/Card.jsx"},{"name":"Monogram","sourcePath":"components/display/Monogram.jsx"},{"name":"StepDots","sourcePath":"components/display/StepDots.jsx"},{"name":"VibeCard","sourcePath":"components/display/VibeCard.jsx"},{"name":"MatchCard","sourcePath":"components/feedback/MatchCard.jsx"},{"name":"StatusPill","sourcePath":"components/feedback/StatusPill.jsx"},{"name":"CheckRow","sourcePath":"components/forms/CheckRow.jsx"},{"name":"Chip","sourcePath":"components/forms/Chip.jsx"},{"name":"Segmented","sourcePath":"components/forms/Segmented.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"ZoneGlow","sourcePath":"components/map/ZoneGlow.jsx"},{"name":"Sheet","sourcePath":"components/surfaces/Sheet.jsx"}],"sourceHashes":{"components/compass/BucketLabel.jsx":"7de646f5fdf9","components/compass/CompassDial.jsx":"71dca2b1f6d9","components/compass/Countdown.jsx":"e171bfb4e978","components/core/Button.jsx":"6524feaecd30","components/core/Icon.jsx":"0924aa40c017","components/core/IconButton.jsx":"93364c57e7fb","components/core/press.js":"4c443b3cce95","components/display/Badge.jsx":"ed7273ab09d2","components/display/Card.jsx":"f6236c695122","components/display/Monogram.jsx":"1125fe1f7672","components/display/StepDots.jsx":"80d367f32849","components/display/VibeCard.jsx":"e49a44fbd2fd","components/feedback/MatchCard.jsx":"a527ebe27858","components/feedback/StatusPill.jsx":"4a7f77930798","components/forms/CheckRow.jsx":"f14106ed5dce","components/forms/Chip.jsx":"68a252133555","components/forms/Segmented.jsx":"e35c9ab18edf","components/forms/Switch.jsx":"01dd9741b2fa","components/map/ZoneGlow.jsx":"8a4dbdd06ba8","components/surfaces/Sheet.jsx":"e6fbdbf8951c","ui_kits/app/Compass.jsx":"3e12098e0aa4","ui_kits/app/Home.jsx":"ddb63f293629","ui_kits/app/Map.jsx":"c15970f0b68a","ui_kits/app/Match.jsx":"26e37abc4758","ui_kits/app/Onboarding.jsx":"f694e9f3dd40","ui_kits/app/ios-frame.jsx":"24642b887be3"},"inlinedExternals":[],"unexposedExports":[{"name":"pressTransition","sourcePath":"components/core/press.js"},{"name":"usePress","sourcePath":"components/core/press.js"}]} */

(() => {

const __ds_ns = (window.JustMateDesignSystem_dee067 = window.JustMateDesignSystem_dee067 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/compass/BucketLabel.jsx
try { (() => {
const BUCKETS = {
  cold: {
    color: "var(--temp-cold)",
    label: "cold",
    range: "over 200 m"
  },
  warm: {
    color: "var(--temp-warm)",
    label: "warm",
    range: "under 200 m"
  },
  hot: {
    color: "var(--temp-hot)",
    label: "hot",
    range: "under 80 m"
  },
  burning: {
    color: "var(--temp-burning)",
    label: "burning",
    range: "under 30 m"
  }
};

/** Distance bucket label — colour is always paired with a word (never colour alone). */
function BucketLabel({
  bucket = "cold",
  align = "center",
  style
}) {
  const b = BUCKETS[bucket] || BUCKETS.cold;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: align === "center" ? "center" : "flex-start",
      gap: 4,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      fontSize: 22,
      lineHeight: "26px",
      letterSpacing: "-0.3px",
      fontWeight: 600,
      fontVariationSettings: "var(--fw-semibold)",
      color: "var(--fg-1)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      borderRadius: 999,
      background: b.color,
      boxShadow: bucket === "burning" ? "0 0 0 3px var(--temp-hot), 0 0 16px var(--temp-hot)" : `0 0 12px ${b.color}`
    }
  }), b.label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      lineHeight: "14px",
      letterSpacing: "0.6px",
      textTransform: "uppercase",
      color: "var(--fg-2)"
    }
  }, b.range));
}
Object.assign(__ds_scope, { BUCKETS, BucketLabel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/compass/BucketLabel.jsx", error: String((e && e.message) || e) }); }

// components/compass/Countdown.jsx
try { (() => {
/** Session countdown, tabular figures so digits don't jitter. Turns `tempHot` at 1:00. */
function Countdown({
  seconds = 600,
  size = "display",
  label = "left",
  style
}) {
  const s = Math.max(0, Math.floor(seconds));
  const txt = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const warn = s <= 60;
  const big = size === "display";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 2,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: big ? 64 : 34,
      lineHeight: big ? "64px" : "38px",
      letterSpacing: big ? "-1.6px" : "-0.7px",
      fontWeight: 700,
      fontVariationSettings: "var(--fw-bold)",
      fontVariantNumeric: "tabular-nums",
      color: warn ? "var(--temp-hot)" : "var(--fg-1)",
      transition: "color var(--dur-fade) ease"
    }
  }, txt), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      lineHeight: "14px",
      letterSpacing: "0.6px",
      textTransform: "uppercase",
      color: "var(--fg-2)"
    }
  }, label));
}
Object.assign(__ds_scope, { Countdown });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/compass/Countdown.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
// Lucide (lucide-static@0.460.0) inner SVG markup, copied programmatically into this file.
const ICONS = {
  "arrow-left": "<path d=\"m12 19-7-7 7-7\" /> <path d=\"M19 12H5\" />",
  "arrow-right": "<path d=\"M5 12h14\" /> <path d=\"m12 5 7 7-7 7\" />",
  "arrow-up": "<path d=\"m5 12 7-7 7 7\" /> <path d=\"M12 19V5\" />",
  "navigation-2": "<polygon points=\"12 2 19 21 12 17 5 21 12 2\" />",
  "x": "<path d=\"M18 6 6 18\" /> <path d=\"m6 6 12 12\" />",
  "check": "<path d=\"M20 6 9 17l-5-5\" />",
  "compass": "<path d=\"m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z\" /> <circle cx=\"12\" cy=\"12\" r=\"10\" />",
  "beer": "<path d=\"M17 11h1a3 3 0 0 1 0 6h-1\" /> <path d=\"M9 12v6\" /> <path d=\"M13 12v6\" /> <path d=\"M14 7.5c-1 0-1.44.5-3 .5s-2-.5-3-.5-1.72.5-2.5.5a2.5 2.5 0 0 1 0-5c.78 0 1.57.5 2.5.5S9.44 2 11 2s2 1.5 3 1.5 1.72-.5 2.5-.5a2.5 2.5 0 0 1 0 5c-.78 0-1.5-.5-2.5-.5Z\" /> <path d=\"M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8\" />",
  "coffee": "<path d=\"M10 2v2\" /> <path d=\"M14 2v2\" /> <path d=\"M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1\" /> <path d=\"M6 2v2\" />",
  "heart": "<path d=\"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z\" />",
  "users": "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\" /> <circle cx=\"9\" cy=\"7\" r=\"4\" /> <path d=\"M22 21v-2a4 4 0 0 0-3-3.87\" /> <path d=\"M16 3.13a4 4 0 0 1 0 7.75\" />",
  "music": "<path d=\"M9 18V5l12-2v13\" /> <circle cx=\"6\" cy=\"18\" r=\"3\" /> <circle cx=\"18\" cy=\"16\" r=\"3\" />",
  "dumbbell": "<path d=\"M14.4 14.4 9.6 9.6\" /> <path d=\"M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z\" /> <path d=\"m21.5 21.5-1.4-1.4\" /> <path d=\"M3.9 3.9 2.5 2.5\" /> <path d=\"M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z\" />",
  "ferris-wheel": "<circle cx=\"12\" cy=\"12\" r=\"2\" /> <path d=\"M12 2v4\" /> <path d=\"m6.8 15-3.5 2\" /> <path d=\"m20.7 7-3.5 2\" /> <path d=\"M6.8 9 3.3 7\" /> <path d=\"m20.7 17-3.5-2\" /> <path d=\"m9 22 3-8 3 8\" /> <path d=\"M8 22h8\" /> <path d=\"M18 18.7a9 9 0 1 0-12 0\" />",
  "search": "<circle cx=\"11\" cy=\"11\" r=\"8\" /> <path d=\"m21 21-4.3-4.3\" />",
  "eye-off": "<path d=\"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49\" /> <path d=\"M14.084 14.158a3 3 0 0 1-4.242-4.242\" /> <path d=\"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143\" /> <path d=\"m2 2 20 20\" />",
  "eye": "<path d=\"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0\" /> <circle cx=\"12\" cy=\"12\" r=\"3\" />",
  "shuffle": "<path d=\"M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22\" /> <path d=\"m18 2 4 4-4 4\" /> <path d=\"M2 6h1.9c1.5 0 2.9.9 3.6 2.2\" /> <path d=\"M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8\" /> <path d=\"m18 14 4 4-4 4\" />",
  "footprints": "<path d=\"M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z\" /> <path d=\"M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z\" /> <path d=\"M16 17h4\" /> <path d=\"M4 13h4\" />",
  "clock": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <polyline points=\"12 6 12 12 16 14\" />",
  "chevron-right": "<path d=\"m9 18 6-6-6-6\" />",
  "chevron-down": "<path d=\"m6 9 6 6 6-6\" />",
  "shield-check": "<path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\" /> <path d=\"m9 12 2 2 4-4\" />",
  "user": "<path d=\"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2\" /> <circle cx=\"12\" cy=\"7\" r=\"4\" />",
  "plus": "<path d=\"M5 12h14\" /> <path d=\"M12 5v14\" />",
  "info": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <path d=\"M12 16v-4\" /> <path d=\"M12 8h.01\" />",
  "lock": "<rect width=\"18\" height=\"11\" x=\"3\" y=\"11\" rx=\"2\" ry=\"2\" /> <path d=\"M7 11V7a5 5 0 0 1 10 0v4\" />",
  "timer": "<line x1=\"10\" x2=\"14\" y1=\"2\" y2=\"2\" /> <line x1=\"12\" x2=\"15\" y1=\"14\" y2=\"11\" /> <circle cx=\"12\" cy=\"14\" r=\"8\" />",
  "flame": "<path d=\"M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z\" />",
  "snowflake": "<line x1=\"2\" x2=\"22\" y1=\"12\" y2=\"12\" /> <line x1=\"12\" x2=\"12\" y1=\"2\" y2=\"22\" /> <path d=\"m20 16-4-4 4-4\" /> <path d=\"m4 8 4 4-4 4\" /> <path d=\"m16 4-4 4-4-4\" /> <path d=\"m8 20 4-4 4 4\" />",
  "thermometer": "<path d=\"M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z\" />",
  "map": "<path d=\"M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z\" /> <path d=\"M15 5.764v15\" /> <path d=\"M9 3.236v15\" />",
  "locate-fixed": "<line x1=\"2\" x2=\"5\" y1=\"12\" y2=\"12\" /> <line x1=\"19\" x2=\"22\" y1=\"12\" y2=\"12\" /> <line x1=\"12\" x2=\"12\" y1=\"2\" y2=\"5\" /> <line x1=\"12\" x2=\"12\" y1=\"19\" y2=\"22\" /> <circle cx=\"12\" cy=\"12\" r=\"7\" /> <circle cx=\"12\" cy=\"12\" r=\"3\" />",
  "wifi-off": "<path d=\"M12 20h.01\" /> <path d=\"M8.5 16.429a5 5 0 0 1 7 0\" /> <path d=\"M5 12.859a10 10 0 0 1 5.17-2.69\" /> <path d=\"M19 12.859a10 10 0 0 0-2.007-1.523\" /> <path d=\"M2 8.82a15 15 0 0 1 4.177-2.643\" /> <path d=\"M22 8.82a15 15 0 0 0-11.288-3.764\" /> <path d=\"m2 2 20 20\" />",
  "radio": "<path d=\"M4.9 19.1C1 15.2 1 8.8 4.9 4.9\" /> <path d=\"M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5\" /> <circle cx=\"12\" cy=\"12\" r=\"2\" /> <path d=\"M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5\" /> <path d=\"M19.1 4.9C23 8.8 23 15.1 19.1 19\" />",
  "sparkles": "<path d=\"M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z\" /> <path d=\"M20 3v4\" /> <path d=\"M22 5h-4\" /> <path d=\"M4 17v2\" /> <path d=\"M5 18H3\" />",
  "hand": "<path d=\"M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2\" /> <path d=\"M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2\" /> <path d=\"M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8\" /> <path d=\"M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15\" />",
  "circle-check": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <path d=\"m9 12 2 2 4-4\" />",
  "settings": "<path d=\"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z\" /> <circle cx=\"12\" cy=\"12\" r=\"3\" />",
  "log-out": "<path d=\"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4\" /> <polyline points=\"16 17 21 12 16 7\" /> <line x1=\"21\" x2=\"9\" y1=\"12\" y2=\"12\" />"
};

/** Lucide line icon. 24 grid, 1.5 stroke by default (Fluid Functionalism rest weight). */
function Icon({
  name,
  size = 20,
  strokeWidth = 1.5,
  color = "currentColor",
  style,
  className,
  label
}) {
  const inner = ICONS[name];
  if (!inner) return null;
  return React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    style: {
      flexShrink: 0,
      display: "block",
      ...style
    },
    role: label ? "img" : undefined,
    "aria-label": label,
    "aria-hidden": label ? undefined : true,
    dangerouslySetInnerHTML: {
      __html: inner
    }
  });
}
Object.assign(__ds_scope, { ICONS, Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/compass/CompassDial.jsx
try { (() => {
/** The compass: arrow rotation = bearing(me→partner) − heading. Critically damped (250ms, no wobble). Never a map position.
 *  The arrow glyph is Lucide `navigation-2`, filled with the bucket colour. */
function CompassDial({
  rotation = 0,
  bucket = "cold",
  size = 280,
  waiting = false,
  style
}) {
  const b = __ds_scope.BUCKETS[bucket] || __ds_scope.BUCKETS.cold;
  const ticks = Array.from({
    length: 60
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: size,
      height: size,
      flexShrink: 0,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      borderRadius: 999,
      background: `radial-gradient(closest-side, color-mix(in oklab, ${b.color} 16%, transparent), transparent 70%)`,
      transition: "background var(--dur-default) ease"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      borderRadius: 999,
      boxShadow: `inset 0 0 0 1px var(--separator)`
    }
  }), ticks.map((_, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      position: "absolute",
      left: "50%",
      top: 0,
      width: i % 5 === 0 ? 2 : 1,
      height: i % 5 === 0 ? 10 : 6,
      marginLeft: i % 5 === 0 ? -1 : -0.5,
      background: i % 15 === 0 ? "var(--fg-2)" : "var(--fg-3)",
      transformOrigin: `50% ${size / 2}px`,
      transform: `rotate(${i * 6}deg) translateY(8px)`
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transform: `rotate(${rotation}deg)`,
      transition: "transform var(--dur-sensor) var(--ease-spring)",
      opacity: waiting ? 0.4 : 1
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: size * 0.62,
    height: size * 0.62,
    viewBox: "0 0 24 24",
    fill: b.color,
    stroke: b.color,
    strokeWidth: "1",
    strokeLinejoin: "round",
    style: {
      filter: `drop-shadow(0 0 ${bucket === "burning" ? 24 : 14}px ${bucket === "burning" ? "var(--temp-hot)" : b.color})`,
      transition: "fill var(--dur-default) ease"
    },
    dangerouslySetInnerHTML: {
      __html: __ds_scope.ICONS["navigation-2"]
    }
  })));
}
Object.assign(__ds_scope, { CompassDial });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/compass/CompassDial.jsx", error: String((e && e.message) || e) }); }

// components/core/press.js
try { (() => {
/** Press-in feedback (DESIGN.md §6.2): react on pointer-down, commit on release. */
function usePress(disabled) {
  const [pressed, setPressed] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const handlers = disabled ? {} : {
    onPointerDown: () => setPressed(true),
    onPointerUp: () => setPressed(false),
    onPointerLeave: () => {
      setPressed(false);
      setHovered(false);
    },
    onPointerEnter: e => {
      if (e.pointerType === "mouse") setHovered(true);
    },
    onPointerCancel: () => setPressed(false)
  };
  return {
    pressed,
    hovered,
    handlers
  };
}
const pressTransition = "transform var(--dur-snappy) var(--ease-spring), background-color var(--dur-fast) ease, box-shadow 180ms var(--ease-spring), opacity var(--dur-fade) ease, color var(--dur-fast) ease";
Object.assign(__ds_scope, { usePress, pressTransition });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/press.js", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Fluid Functionalism button, pill shape. Heights scaled to mobile (44pt min target).
const SIZES = {
  lg: {
    h: 52,
    px: 24,
    fs: 16,
    icon: 18,
    gap: 8
  },
  md: {
    h: 44,
    px: 20,
    fs: 15,
    icon: 17,
    gap: 6
  },
  sm: {
    h: 36,
    px: 16,
    fs: 13,
    icon: 16,
    gap: 6
  }
};
function look(variant, hovered, pressed) {
  switch (variant) {
    case "glow":
      return {
        bg: pressed ? "var(--glow-press)" : hovered ? "var(--glow-hover)" : "var(--glow)",
        fg: "var(--on-glow)",
        ring: "transparent",
        glow: true
      };
    case "secondary":
      return {
        bg: hovered && !pressed ? "var(--tint-hover)" : "var(--tint)",
        fg: "var(--fg-1)",
        ring: "transparent"
      };
    case "tertiary":
      return {
        bg: pressed ? "var(--active)" : hovered ? "var(--hover)" : "transparent",
        fg: "var(--fg-1)",
        ring: "var(--border)"
      };
    case "danger":
      return {
        bg: pressed ? "color-mix(in oklab,var(--danger) 85%,#000)" : hovered ? "color-mix(in oklab,var(--danger) 92%,#000)" : "var(--danger)",
        fg: "#fff",
        ring: "transparent"
      };
    case "ghost":
      return {
        bg: pressed ? "var(--active)" : hovered ? "var(--hover)" : "transparent",
        fg: hovered ? "var(--fg-1)" : "var(--fg-2)",
        ring: "transparent"
      };
    case "primary":
    case "neutral":
    default:
      return {
        bg: pressed ? "color-mix(in oklab,var(--fg-1) 80%,var(--background))" : hovered ? "color-mix(in oklab,var(--fg-1) 90%,var(--background))" : "var(--fg-1)",
        fg: "var(--background)",
        ring: "transparent"
      };
  }
}

/** JustMate button (Fluid Functionalism recipe, pill). primary = foreground fill; glow = amber, for the one match moment; danger = Vanish only. */
function Button({
  children,
  variant = "primary",
  size = "lg",
  leadingIcon,
  trailingIcon,
  fullWidth = false,
  loading = false,
  disabled = false,
  onClick,
  style,
  type = "button",
  ...rest
}) {
  const s = SIZES[size] || SIZES.lg;
  const {
    pressed,
    hovered,
    handlers
  } = __ds_scope.usePress(disabled || loading);
  const c = look(variant, hovered, pressed);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled || loading,
    onClick: onClick
  }, handlers, rest, {
    style: {
      position: "relative",
      display: fullWidth ? "flex" : "inline-flex",
      width: fullWidth ? "100%" : undefined,
      alignItems: "center",
      justifyContent: "center",
      gap: s.gap,
      height: s.h,
      paddingLeft: leadingIcon ? s.px - 4 : s.px,
      paddingRight: trailingIcon ? s.px - 4 : s.px,
      border: 0,
      borderRadius: "var(--radius-button)",
      background: c.bg,
      color: c.fg,
      boxShadow: `0 0 0 ${pressed ? 0 : 1}px ${c.ring === "transparent" ? c.bg : "transparent"}, inset 0 0 0 1px ${c.ring}${c.glow && !disabled ? ", var(--shadow-glow)" : ""}`,
      fontFamily: "var(--font-sans)",
      fontSize: s.fs,
      fontWeight: 500,
      fontVariationSettings: hovered || pressed ? "var(--fw-semibold)" : "var(--fw-medium)",
      letterSpacing: "-0.1px",
      cursor: disabled ? "default" : "pointer",
      whiteSpace: "nowrap",
      transform: pressed ? "scale(var(--press-scale))" : "scale(1)",
      transition: __ds_scope.pressTransition + ", font-variation-settings var(--dur-fast) ease",
      opacity: disabled ? 0.4 : 1,
      WebkitTapHighlightColor: "transparent",
      ...style
    }
  }), loading ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: s.icon,
      height: s.icon,
      borderRadius: 999,
      border: "2px solid currentColor",
      borderRightColor: "transparent",
      animation: "jm-spin 0.8s linear infinite"
    }
  }) : /*#__PURE__*/React.createElement(React.Fragment, null, leadingIcon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: leadingIcon,
    size: s.icon,
    strokeWidth: pressed || hovered ? 2 : 1.5,
    style: {
      transition: "stroke-width var(--dur-fast) ease"
    }
  }), /*#__PURE__*/React.createElement("span", null, children), trailingIcon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: trailingIcon,
    size: s.icon,
    strokeWidth: pressed || hovered ? 2 : 1.5
  })));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Round icon-only control. `material` floats over the map (thin blur); `tint` sits on sheets; `ghost` is chrome. */
function IconButton({
  icon,
  label,
  variant = "material",
  size = 44,
  iconSize,
  disabled = false,
  onClick,
  style,
  ...rest
}) {
  const {
    pressed,
    hovered,
    handlers
  } = __ds_scope.usePress(disabled);
  const bg = variant === "material" ? "var(--material-thin)" : variant === "tint" ? hovered ? "var(--tint-hover)" : "var(--tint)" : variant === "solid" ? "var(--fg-1)" : pressed ? "var(--active)" : hovered ? "var(--hover)" : "transparent";
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    disabled: disabled,
    onClick: onClick
  }, handlers, rest, {
    style: {
      width: size,
      height: size,
      borderRadius: 999,
      border: 0,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: bg,
      color: variant === "solid" ? "var(--background)" : "var(--fg-1)",
      backdropFilter: variant === "material" ? "var(--blur-thin)" : undefined,
      WebkitBackdropFilter: variant === "material" ? "var(--blur-thin)" : undefined,
      boxShadow: variant === "material" ? "inset 0 1px 0 0 var(--hairline-top), var(--shadow-3)" : "none",
      cursor: "pointer",
      transform: pressed ? "scale(0.94)" : "scale(1)",
      transition: __ds_scope.pressTransition,
      opacity: disabled ? 0.4 : 1,
      padding: 0,
      ...style
    }
  }), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: iconSize || Math.round(size * 0.45),
    strokeWidth: hovered || pressed ? 2 : 1.75
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/display/Badge.jsx
try { (() => {
const HUES = {
  gray: null,
  glow: "#FFB23F",
  self: "#5EEAD4",
  cold: "#64B5F6",
  hot: "#FF7A1A",
  success: "#30D158",
  danger: "#FF453A"
};

/** Short status/metadata label (FF badge): `solid` = 15% tint under foreground text; `dot` = outline + coloured dot. Text never takes the hue. */
function Badge({
  children,
  color = "gray",
  variant = "solid",
  size = "md",
  style
}) {
  const hex = HUES[color];
  const h = size === "sm" ? 20 : 24;
  const bg = variant === "dot" ? "transparent" : hex ? `color-mix(in srgb, ${hex} 18%, var(--background))` : "var(--track-off)";
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: size === "sm" ? 4 : 6,
      height: h,
      padding: `0 ${size === "sm" ? 8 : 10}px`,
      borderRadius: 999,
      background: bg,
      color: "var(--fg-1)",
      boxShadow: variant === "dot" ? "inset 0 0 0 1px var(--border)" : "none",
      fontSize: size === "sm" ? 11 : 12,
      fontWeight: 500,
      fontVariationSettings: "var(--fw-medium)",
      whiteSpace: "nowrap",
      fontVariantNumeric: "tabular-nums",
      ...style
    }
  }, variant === "dot" && /*#__PURE__*/React.createElement("span", {
    style: {
      width: size === "sm" ? 6 : 7,
      height: size === "sm" ? 6 : 7,
      borderRadius: 999,
      background: hex || "var(--fg-muted)"
    }
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Badge.jsx", error: String((e && e.message) || e) }); }

// components/display/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Solid surface card on the FF elevation ladder. Use for stat rows, post-meet totals, settings groups. */
function Card({
  children,
  level = 3,
  padding = 20,
  radius = "var(--radius-card)",
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({}, rest, {
    style: {
      background: `var(--surface-${Math.min(8, Math.max(1, level))})`,
      boxShadow: `var(--shadow-${level})`,
      borderRadius: radius,
      padding,
      ...style
    }
  }), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Card.jsx", error: String((e && e.message) || e) }); }

// components/display/Monogram.jsx
try { (() => {
/** Own avatar: a monogram, never a photo. Other people never get an avatar. */
function Monogram({
  initials = "A",
  size = 36,
  onClick,
  style
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    "aria-label": "Edit profile",
    style: {
      width: size,
      height: size,
      borderRadius: 999,
      border: 0,
      padding: 0,
      flexShrink: 0,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--material-thin)",
      backdropFilter: "var(--blur-thin)",
      WebkitBackdropFilter: "var(--blur-thin)",
      boxShadow: "inset 0 1px 0 0 var(--hairline-top), inset 0 0 0 1px var(--separator)",
      color: "var(--fg-1)",
      fontFamily: "var(--font-sans)",
      fontSize: Math.round(size * 0.38),
      fontWeight: 600,
      fontVariationSettings: "var(--fw-semibold)",
      letterSpacing: "-0.2px",
      cursor: onClick ? "pointer" : "default",
      ...style
    }
  }, initials.slice(0, 2).toUpperCase());
}
Object.assign(__ds_scope, { Monogram });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Monogram.jsx", error: String((e && e.message) || e) }); }

// components/display/StepDots.jsx
try { (() => {
/** Step/page indicator: active step stretches into a short dash (onboarding steps, card carousels). */
function StepDots({
  count = 3,
  active = 0,
  onSelect,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      ...style
    }
  }, Array.from({
    length: count
  }).map((_, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    onClick: () => onSelect && onSelect(i),
    style: {
      height: 6,
      width: i === active ? 20 : 6,
      borderRadius: 999,
      background: i === active ? "var(--fg-1)" : "var(--fg-3)",
      cursor: onSelect ? "pointer" : "default",
      transition: "width var(--dur-moderate) var(--ease-spring), background-color var(--dur-moderate) ease"
    }
  })));
}
Object.assign(__ds_scope, { StepDots });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/StepDots.jsx", error: String((e && e.message) || e) }); }

// components/display/VibeCard.jsx
try { (() => {
/** The faceless identity: a 2-line vibe quote. Typography only — never a photo. Doubles as the icebreaker. */
function VibeCard({
  quote,
  intent,
  eyebrow = "their vibe",
  compact = false,
  style,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: "var(--radius-card)",
      background: "var(--surface-card)",
      boxShadow: "var(--shadow-3)",
      padding: compact ? "16px 18px" : "22px 22px 20px",
      display: "flex",
      flexDirection: "column",
      gap: compact ? 8 : 12,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      lineHeight: "14px",
      letterSpacing: "0.6px",
      textTransform: "uppercase",
      color: "var(--fg-2)"
    }
  }, eyebrow), intent && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      lineHeight: "14px",
      letterSpacing: "0.6px",
      textTransform: "uppercase",
      color: "var(--fg-2)"
    }
  }, "wants \xB7 ", intent)), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: compact ? 17 : 20,
      lineHeight: compact ? "23px" : "27px",
      letterSpacing: "-0.2px",
      fontStyle: "italic",
      fontWeight: 500,
      fontVariationSettings: "var(--fw-medium)",
      color: "var(--fg-1)",
      textWrap: "pretty"
    }
  }, "\u201C", quote, "\u201D"), children);
}
Object.assign(__ds_scope, { VibeCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/VibeCard.jsx", error: String((e && e.message) || e) }); }

// components/feedback/MatchCard.jsx
try { (() => {
/** Match offer card — arrives on both phones at once, from the top. Buttons only, no swipe-to-dismiss.
 *  state: offered · waiting (after accept; button morphs in place) · expired (never "they declined"). */
function MatchCard({
  percent = 78,
  intent = "beer",
  quote,
  state = "offered",
  secondsLeft,
  onAccept,
  onDismiss,
  style
}) {
  const expired = state === "expired";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 32,
      background: "var(--surface-card)",
      boxShadow: "var(--shadow-8)",
      padding: "24px 20px 18px",
      display: "flex",
      flexDirection: "column",
      gap: 18,
      color: "var(--fg-1)",
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: 12,
      opacity: expired ? 0.4 : 1,
      transition: "opacity var(--dur-fade) ease"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      lineHeight: "14px",
      letterSpacing: "0.6px",
      textTransform: "uppercase",
      color: "var(--fg-2)"
    }
  }, "match \xB7 wants: ", intent), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 64,
      lineHeight: "64px",
      letterSpacing: "-1.6px",
      fontWeight: 700,
      fontVariationSettings: "var(--fw-bold)",
      fontVariantNumeric: "tabular-nums"
    }
  }, percent, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 34,
      letterSpacing: "-0.7px",
      color: "var(--fg-2)"
    }
  }, "%"))), secondsLeft != null && !expired && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      letterSpacing: "0.6px",
      color: "var(--fg-2)",
      fontVariantNumeric: "tabular-nums",
      paddingBottom: 8
    }
  }, "0:", String(secondsLeft).padStart(2, "0"))), quote && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 20,
      lineHeight: "27px",
      letterSpacing: "-0.2px",
      fontStyle: "italic",
      fontWeight: 500,
      fontVariationSettings: "var(--fw-medium)",
      textWrap: "pretty",
      opacity: expired ? 0.4 : 1
    }
  }, "\u201C", quote, "\u201D"), expired ? /*#__PURE__*/React.createElement("div", {
    style: {
      height: 56,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 999,
      background: "var(--muted)",
      color: "var(--fg-2)",
      fontSize: 17,
      fontWeight: 600
    }
  }, "offer expired") : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, state === "waiting" ? /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "secondary",
    fullWidth: true,
    loading: false,
    disabled: true
  }, "waiting for them\u2026") : /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "glow",
    fullWidth: true,
    leadingIcon: "compass",
    onClick: onAccept
  }, "Open compass"), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "ghost",
    fullWidth: true,
    size: "md",
    onClick: onDismiss
  }, "Dismiss")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      lineHeight: "18px",
      letterSpacing: "0.1px",
      color: "var(--fg-2)",
      textAlign: "center"
    }
  }, expired ? "you're still searching" : "unlocks only if they accept too"));
}
Object.assign(__ds_scope, { MatchCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/MatchCard.jsx", error: String((e && e.message) || e) }); }

// components/feedback/StatusPill.jsx
try { (() => {
/** Top status pill (thin material). States: invisible · searching (1 Hz dot, the only allowed loop) · offline. */
function StatusPill({
  status = "invisible",
  intent,
  style
}) {
  const searching = status === "searching";
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    "aria-live": "polite",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      height: 36,
      padding: "0 14px 0 12px",
      borderRadius: 999,
      background: "var(--material-thin)",
      backdropFilter: "var(--blur-thin)",
      WebkitBackdropFilter: "var(--blur-thin)",
      boxShadow: "inset 0 1px 0 0 var(--hairline-top), var(--shadow-3)",
      color: "var(--fg-1)",
      fontFamily: "var(--font-sans)",
      fontSize: 13,
      lineHeight: "18px",
      fontWeight: 600,
      fontVariationSettings: "var(--fw-semibold)",
      letterSpacing: "0.1px",
      whiteSpace: "nowrap",
      ...style
    }
  }, searching && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 999,
      background: "var(--glow)",
      boxShadow: "0 0 8px var(--glow)",
      animation: "jm-pulse 1s ease-in-out infinite"
    }
  }), status === "invisible" && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "eye-off",
    size: 15,
    strokeWidth: 2
  }), status === "offline" && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "wifi-off",
    size: 15,
    strokeWidth: 2
  }), /*#__PURE__*/React.createElement("span", null, searching ? /*#__PURE__*/React.createElement(React.Fragment, null, "searching", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--fg-2)"
    }
  }, ": ", intent || "beer")) : status));
}
Object.assign(__ds_scope, { StatusPill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/StatusPill.jsx", error: String((e && e.message) || e) }); }

// components/forms/CheckRow.jsx
try { (() => {
/** Full-width checkbox row (≥ 56px) — the explicit, blocking 18+ gate. Never a tiny box. */
function CheckRow({
  label,
  description,
  checked = false,
  onToggle,
  style
}) {
  const [pressed, setPressed] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    role: "checkbox",
    "aria-checked": checked,
    onClick: onToggle,
    onPointerDown: () => setPressed(true),
    onPointerUp: () => setPressed(false),
    onPointerLeave: () => setPressed(false),
    style: {
      width: "100%",
      minHeight: 56,
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "12px 16px",
      border: 0,
      textAlign: "left",
      borderRadius: "var(--radius-row)",
      background: "var(--surface-raised)",
      boxShadow: "inset 0 0 0 1px var(--separator)",
      color: "var(--fg-1)",
      fontFamily: "var(--font-sans)",
      cursor: "pointer",
      transform: pressed ? "scale(0.985)" : "scale(1)",
      transition: "transform var(--dur-snappy) var(--ease-spring)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 24,
      height: 24,
      borderRadius: 999,
      flexShrink: 0,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: checked ? "var(--fg-1)" : "transparent",
      boxShadow: checked ? "none" : "inset 0 0 0 1.5px var(--fg-3)",
      color: "var(--background)",
      transition: "background-color var(--dur-fast) ease"
    }
  }, checked && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 16,
    strokeWidth: 2.5
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 17,
      lineHeight: "22px",
      fontWeight: 600,
      fontVariationSettings: "var(--fw-semibold)",
      letterSpacing: "-0.1px"
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      lineHeight: "18px",
      color: "var(--fg-2)"
    }
  }, description)));
}
Object.assign(__ds_scope, { CheckRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/CheckRow.jsx", error: String((e && e.message) || e) }); }

// components/forms/Chip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Intent / interest chip. Solid on sheets (never translucent on translucent). Selected = foreground fill (FF). Weight shifts medium → semibold on hover. */
function Chip({
  children,
  selected = false,
  icon,
  size = "md",
  disabled = false,
  onClick,
  style,
  ...rest
}) {
  const {
    pressed,
    hovered,
    handlers
  } = __ds_scope.usePress(disabled);
  const h = size === "sm" ? 32 : 40;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-pressed": selected,
    disabled: disabled,
    onClick: onClick
  }, handlers, rest, {
    style: {
      height: h,
      padding: icon ? `0 ${size === "sm" ? 12 : 16}px 0 ${size === "sm" ? 10 : 12}px` : `0 ${size === "sm" ? 12 : 16}px`,
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      flexShrink: 0,
      border: 0,
      borderRadius: "var(--radius-chip)",
      background: selected ? "var(--fg-1)" : hovered ? "color-mix(in oklab,var(--surface-chip),rgb(var(--overlay)) 6%)" : "var(--surface-chip)",
      color: selected ? "var(--background)" : "var(--fg-1)",
      boxShadow: selected ? "none" : "inset 0 0 0 1px var(--separator)",
      fontFamily: "var(--font-sans)",
      fontSize: size === "sm" ? 13 : 15,
      fontWeight: 500,
      fontVariationSettings: selected || hovered ? "var(--fw-semibold)" : "var(--fw-medium)",
      letterSpacing: "-0.1px",
      cursor: "pointer",
      transform: pressed ? "scale(var(--press-scale))" : "scale(1)",
      transition: __ds_scope.pressTransition + ", font-variation-settings var(--dur-fast) ease",
      opacity: disabled ? 0.4 : 1,
      whiteSpace: "nowrap",
      ...style
    }
  }), icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: size === "sm" ? 15 : 17,
    strokeWidth: selected ? 2 : 1.75
  }), children);
}
Object.assign(__ds_scope, { Chip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Chip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Segmented.jsx
try { (() => {
/** Segmented control with a sliding solid indicator (FF tabs: critically-damped, 160ms). Items: [{value,label?,icon?}]. */
function Segmented({
  items = [],
  value,
  onChange,
  fullWidth = true,
  style
}) {
  const idx = Math.max(0, items.findIndex(i => i.value === value));
  const n = items.length || 1;
  return /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    style: {
      position: "relative",
      display: fullWidth ? "grid" : "inline-grid",
      gridTemplateColumns: `repeat(${n}, minmax(0,1fr))`,
      padding: 4,
      height: 44,
      boxSizing: "border-box",
      borderRadius: 999,
      background: "var(--muted)",
      boxShadow: "inset 0 0 0 1px var(--separator)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      top: 4,
      bottom: 4,
      left: 4,
      width: `calc((100% - 8px) / ${n})`,
      borderRadius: 999,
      background: "var(--fg-1)",
      transform: `translateX(${idx * 100}%)`,
      transition: "transform var(--dur-moderate) var(--ease-spring)"
    }
  }), items.map((it, i) => {
    const on = i === idx;
    return /*#__PURE__*/React.createElement("button", {
      key: it.value,
      role: "tab",
      "aria-selected": on,
      "aria-label": it.label || it.value,
      onClick: () => onChange && onChange(it.value),
      style: {
        position: "relative",
        zIndex: 1,
        border: 0,
        background: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "0 14px",
        color: on ? "var(--background)" : "var(--fg-2)",
        fontFamily: "var(--font-sans)",
        fontSize: 14,
        fontWeight: 600,
        fontVariationSettings: on ? "var(--fw-semibold)" : "var(--fw-medium)",
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "color var(--dur-moderate) var(--ease-spring)"
      }
    }, it.icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: it.icon,
      size: 18,
      strokeWidth: on ? 2 : 1.5
    }), it.label);
  }));
}
Object.assign(__ds_scope, { Segmented });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Segmented.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
/** Labeled switch row (Fluid Functionalism geometry: 34×20 track, 16px thumb, 2px inset; thumb stretches on hover/press). On = FF blue #6B97FF. */
function Switch({
  label,
  checked = false,
  onToggle,
  disabled = false,
  style
}) {
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const TW = 34,
    TH = 20,
    T = 16,
    O = 2;
  const travel = TW - T - O * 2;
  const w = pressed ? T + 4 : hovered ? T + 2 : T;
  const h = pressed ? T - 4 : T;
  const x = checked ? O + travel - (w - T) : O;
  const y = pressed ? O + 2 : O;
  return /*#__PURE__*/React.createElement("div", {
    role: "switch",
    "aria-checked": checked,
    tabIndex: 0,
    onClick: () => !disabled && onToggle && onToggle(),
    onKeyDown: e => {
      if (!disabled && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        onToggle && onToggle();
      }
    },
    onPointerEnter: e => e.pointerType === "mouse" && setHovered(true),
    onPointerLeave: () => {
      setHovered(false);
      setPressed(false);
    },
    onPointerDown: () => setPressed(true),
    onPointerUp: () => setPressed(false),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      minHeight: 44,
      cursor: "pointer",
      userSelect: "none",
      opacity: disabled ? 0.4 : 1,
      outlineOffset: 2,
      borderRadius: 8,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      width: TW,
      height: TH,
      borderRadius: 999,
      flexShrink: 0,
      transition: "background-color var(--dur-fast) ease",
      background: checked ? hovered ? "#5C89F2" : "#6B97FF" : hovered ? "color-mix(in oklab,var(--track-off),rgb(var(--overlay)) 10%)" : "var(--track-off)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      width: w,
      height: h,
      borderRadius: 999,
      background: "#fff",
      boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
      transform: `translate(${x}px, ${y}px)`,
      transition: "transform var(--dur-moderate) var(--ease-spring), width var(--dur-moderate) var(--ease-spring), height var(--dur-moderate) var(--ease-spring)"
    }
  })), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      lineHeight: "20px",
      color: checked ? "var(--fg-1)" : "var(--fg-2)",
      transition: "color var(--dur-fast) ease"
    }
  }, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/map/ZoneGlow.jsx
try { (() => {
/** Anonymous zone glow — amber halo + core, sized/brightened by density `n`. Never a pin. Grows from its centre once per update. */
function ZoneGlow({
  n = 4,
  size,
  visible = true,
  onClick,
  style
}) {
  const d = size || Math.round(80 + Math.min(n, 12) * 14);
  const coreOpacity = Math.min(0.9, 0.25 + n * 0.06);
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    role: onClick ? "button" : undefined,
    "aria-label": `about ${n} searching here`,
    style: {
      position: "absolute",
      width: d,
      height: d,
      marginLeft: -d / 2,
      marginTop: -d / 2,
      borderRadius: 999,
      cursor: onClick ? "pointer" : "default",
      background: `radial-gradient(closest-side, rgba(255,190,90,${coreOpacity}) 0%, rgba(255,160,40,${coreOpacity * 0.6}) 35%, rgba(255,160,40,0.14) 70%, rgba(255,160,40,0) 100%)`,
      mixBlendMode: "var(--glow-blend)",
      transform: visible ? "scale(1)" : "scale(0.6)",
      opacity: visible ? 1 : 0,
      transition: "transform var(--dur-default) var(--ease-spring), opacity var(--dur-default) ease",
      ...style
    }
  });
}
Object.assign(__ds_scope, { ZoneGlow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/map/ZoneGlow.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Sheet.jsx
try { (() => {
/** Bottom sheet — thick material over the map, 28px top radius, bright 1px top edge, grabber. Chips/buttons inside stay solid. */
function Sheet({
  children,
  grabber = true,
  padding = 24,
  material = true,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      borderTopLeftRadius: "var(--radius-sheet)",
      borderTopRightRadius: "var(--radius-sheet)",
      background: material ? "var(--material-thick)" : "var(--surface-1)",
      backdropFilter: material ? "var(--blur-thick)" : undefined,
      WebkitBackdropFilter: material ? "var(--blur-thick)" : undefined,
      boxShadow: "var(--shadow-sheet)",
      padding: `${grabber ? 10 : padding}px ${padding}px ${padding}px`,
      color: "var(--fg-1)",
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, grabber && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 5,
      borderRadius: 999,
      background: "var(--fg-3)",
      margin: "0 auto 16px"
    }
  }), children);
}
Object.assign(__ds_scope, { Sheet });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Sheet.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/Compass.jsx
try { (() => {
// Compass — opaque, fullscreen. Arrow + bucket + countdown + pinned vibe card + Vanish. Then the post-meet screen.
const CP_NS = window.JustMateDesignSystem_dee067;
function Compass({
  intent,
  onVanish,
  onMet
}) {
  const {
    CompassDial,
    BucketLabel,
    Countdown,
    VibeCard,
    Button
  } = CP_NS;
  const [t, setT] = React.useState(0);
  const [rot, setRot] = React.useState(38);
  React.useEffect(() => {
    const i = setInterval(() => {
      setT(x => x + 1);
      setRot(r => r * 0.86 + (Math.random() * 16 - 8));
    }, 1000);
    return () => clearInterval(i);
  }, []);
  const dist = Math.max(18, 320 - t * 22);
  const bucket = dist < 30 ? "burning" : dist < 80 ? "hot" : dist < 200 ? "warm" : "cold";
  const waiting = t < 2;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "var(--background)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "64px 16px 36px",
      boxSizing: "border-box",
      animation: "cp-in var(--dur-default) var(--ease-spring)"
    }
  }, /*#__PURE__*/React.createElement(Countdown, {
    seconds: 600 - t * 7,
    label: `left · ${(intent || "beer").toLowerCase()}`
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(CompassDial, {
    rotation: rot,
    bucket: bucket,
    size: 300,
    waiting: waiting
  }), waiting ? /*#__PURE__*/React.createElement("span", {
    className: "t-title",
    style: {
      color: "var(--fg-2)"
    }
  }, "finding signal\u2026") : /*#__PURE__*/React.createElement(BucketLabel, {
    bucket: bucket
  })), /*#__PURE__*/React.createElement(VibeCard, {
    compact: true,
    eyebrow: "you're looking for",
    intent: (intent || "beer").toLowerCase(),
    quote: "quietly funny \u2014 will out-argue you about pizza",
    style: {
      width: "100%",
      boxSizing: "border-box"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      width: "100%",
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "danger",
    size: "lg",
    leadingIcon: "x",
    onClick: onVanish
  }, "Vanish"), /*#__PURE__*/React.createElement(Button, {
    variant: bucket === "burning" ? "glow" : "secondary",
    size: "lg",
    fullWidth: true,
    leadingIcon: "hand",
    disabled: bucket !== "burning",
    onClick: onMet
  }, "We met")));
}
function PostMeet({
  onBack
}) {
  const {
    Button,
    Card,
    Icon
  } = CP_NS;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "var(--background)",
      display: "flex",
      flexDirection: "column",
      padding: "64px 16px 36px",
      boxSizing: "border-box",
      animation: "ob-fade var(--dur-default) ease"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--success)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "circle-check",
    size: 28,
    strokeWidth: 1.75
  })), /*#__PURE__*/React.createElement("span", {
    className: "t-mono",
    style: {
      color: "var(--fg-2)"
    }
  }, "you walked"), /*#__PURE__*/React.createElement("span", {
    className: "t-display",
    style: {
      fontSize: 96,
      lineHeight: "92px",
      letterSpacing: "-3px"
    }
  }, "480 m"), /*#__PURE__*/React.createElement("span", {
    className: "t-title"
  }, "to meet. Go say hi.")), /*#__PURE__*/React.createElement(Card, {
    level: 2,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--glow)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "footprints",
    size: 22
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "t-headline tabular"
  }, "2.3 km walked to meetings"), /*#__PURE__*/React.createElement("div", {
    className: "t-footnote"
  }, "5 meetings \xB7 this device only"))), /*#__PURE__*/React.createElement(Button, {
    fullWidth: true,
    onClick: onBack
  }, "Back to the map"));
}
Object.assign(window, {
  Compass,
  PostMeet
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/Compass.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/Home.jsx
try { (() => {
// Home — "Where to?". Map fullscreen, thin pill on top, thick sheet at the bottom, one primary action.
const HOME_NS = window.JustMateDesignSystem_dee067;
const INTENTS = [["Soul mate", "heart"], ["Beer", "beer"], ["Coffee", "coffee"], ["Attractions", "ferris-wheel"], ["Friends", "users"], ["Sports", "dumbbell"], ["Music", "music"]];
function Home({
  mode,
  intent,
  setIntent,
  elapsed,
  onFind,
  onStop,
  onProfile
}) {
  const {
    Sheet,
    Chip,
    Button,
    StatusPill,
    Monogram,
    IconButton,
    Icon,
    Badge
  } = HOME_NS;
  const [zone, setZone] = React.useState(null);
  const searching = mode === "searching";
  React.useEffect(() => {
    if (!zone) return;
    const t = setTimeout(() => setZone(null), 2400);
    return () => clearTimeout(t);
  }, [zone]);
  const iconFor = (INTENTS.find(([l]) => l === intent) || [])[1] || "search";
  const mm = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0
    }
  }, /*#__PURE__*/React.createElement(MapBase, {
    live: searching,
    onZone: setZone
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 58,
      left: 16,
      right: 16,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement(StatusPill, {
    status: searching ? "searching" : "invisible",
    intent: intent && intent.toLowerCase()
  }), /*#__PURE__*/React.createElement(Monogram, {
    initials: "AK",
    size: 40,
    onClick: onProfile
  })), zone && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 110,
      left: 0,
      right: 0,
      display: "flex",
      justifyContent: "center",
      animation: "ob-in var(--dur-snappy) var(--ease-spring)"
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    color: "glow",
    variant: "dot",
    style: {
      height: 32,
      padding: "0 14px",
      fontSize: 13,
      background: "var(--material-thin)",
      backdropFilter: "var(--blur-thin)"
    }
  }, "~", zone.n, " compatible around here")), /*#__PURE__*/React.createElement(IconButton, {
    icon: "locate-fixed",
    label: "Recenter",
    style: {
      position: "absolute",
      right: 16,
      bottom: searching ? 210 : intent ? 300 : 230,
      transition: "bottom var(--dur-default) var(--ease-spring)"
    }
  }), /*#__PURE__*/React.createElement(Sheet, {
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      paddingBottom: 40
    }
  }, searching ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 48,
      height: 48,
      borderRadius: 999,
      background: "var(--fg-1)",
      color: "var(--background)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: iconFor,
    size: 22,
    strokeWidth: 1.75
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "t-title"
  }, "Looking for ", intent.toLowerCase()), /*#__PURE__*/React.createElement("div", {
    className: "t-footnote"
  }, "You're visible to compatible people nearby")), /*#__PURE__*/React.createElement("span", {
    className: "t-mono tabular",
    style: {
      color: "var(--fg-2)"
    }
  }, mm)), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "md",
    fullWidth: true,
    onClick: onStop
  }, "Stop searching")) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "t-large-title"
  }, "Where to?"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      overflowX: "auto",
      margin: "0 -24px",
      padding: "0 24px",
      scrollbarWidth: "none"
    }
  }, INTENTS.map(([l, i]) => /*#__PURE__*/React.createElement(Chip, {
    key: l,
    icon: i,
    selected: intent === l,
    onClick: () => setIntent(intent === l ? null : l)
  }, l))), intent ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14,
      animation: "ob-in var(--dur-snappy) var(--ease-spring)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "t-footnote",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sparkles",
    size: 14
  }), "Usually busy around here on a Saturday night"), /*#__PURE__*/React.createElement(Button, {
    fullWidth: true,
    leadingIcon: "search",
    onClick: onFind
  }, "Find people")) : /*#__PURE__*/React.createElement("div", {
    className: "t-footnote"
  }, "You're invisible. Pick what you want right now."))));
}
Object.assign(window, {
  Home
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/Home.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/Map.jsx
try { (() => {
// Map stand-in: plain --map-bg with a subtle CSS street grid (no external tiles) + zone glows + own dot. No pins, ever.
const MAP_NS = window.JustMateDesignSystem_dee067;
const ZONES = [{
  id: "a",
  x: 0.30,
  y: 0.30,
  n: 6
}, {
  id: "b",
  x: 0.70,
  y: 0.24,
  n: 3
}, {
  id: "c",
  x: 0.62,
  y: 0.47,
  n: 9
}, {
  id: "d",
  x: 0.22,
  y: 0.56,
  n: 4
}, {
  id: "e",
  x: 0.80,
  y: 0.64,
  n: 2
}];
function MapBase({
  width = 402,
  height = 874,
  live = false,
  onZone
}) {
  const {
    ZoneGlow
  } = MAP_NS;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      overflow: "hidden",
      background: "var(--map-bg)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "repeating-linear-gradient(0deg, var(--map-line) 0 1px, transparent 1px 64px), repeating-linear-gradient(90deg, var(--map-line) 0 1px, transparent 1px 64px), repeating-linear-gradient(32deg, transparent 0 140px, var(--map-street) 140px 146px, transparent 146px 300px)",
      opacity: live ? 1 : 0.55,
      transition: "opacity var(--dur-default) ease"
    }
  }), ZONES.map(z => /*#__PURE__*/React.createElement(ZoneGlow, {
    key: z.id,
    n: z.n,
    visible: live,
    onClick: live ? () => onZone && onZone(z) : undefined,
    style: {
      left: z.x * width,
      top: z.y * height
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      left: width * 0.5,
      top: height * 0.44,
      width: 14,
      height: 14,
      margin: -7,
      borderRadius: 999,
      background: "var(--self)",
      boxShadow: "0 0 0 4px rgba(94,234,212,0.22), 0 0 16px rgba(94,234,212,0.6)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      height: 140,
      background: "linear-gradient(var(--background), transparent)",
      pointerEvents: "none"
    }
  }));
}
Object.assign(window, {
  MapBase,
  ZONES
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/Map.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/Match.jsx
try { (() => {
// Match overlay — scrim + paper card from the top, on both phones at once. Buttons only.
const MATCH_NS = window.JustMateDesignSystem_dee067;
function MatchOverlay({
  intent,
  state,
  secondsLeft,
  onAccept,
  onDismiss
}) {
  const {
    MatchCard
  } = MATCH_NS;
  const [shown, setShown] = React.useState(false);
  React.useEffect(() => {
    const r = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(r);
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      zIndex: 30
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "var(--scrim)",
      opacity: shown ? 1 : 0,
      transition: "opacity var(--dur-default) ease"
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "light",
    style: {
      position: "absolute",
      left: 12,
      right: 12,
      top: 56,
      background: "transparent",
      transform: shown ? "translateY(0) scale(1)" : "translateY(-120%) scale(0.96)",
      transition: "transform var(--dur-default) var(--ease-spring)"
    }
  }, /*#__PURE__*/React.createElement(MatchCard, {
    percent: 78,
    intent: (intent || "beer").toLowerCase(),
    quote: "quietly funny \u2014 will out-argue you about pizza",
    state: state,
    secondsLeft: secondsLeft,
    onAccept: onAccept,
    onDismiss: onDismiss
  })));
}
Object.assign(window, {
  MatchOverlay
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/Match.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/Onboarding.jsx
try { (() => {
// Onboarding — 3 steps, faceless profile. Teaches the three rules before the map.
const OB_NS = window.JustMateDesignSystem_dee067;
const INTERESTS = ["beer", "coffee", "boardgames", "rock", "techno", "hiking", "cinema", "books", "travel", "tech", "dogs", "climbing", "photography", "food"];
const VIBES = ["quietly funny — will out-argue you about pizza", "early bird with a film camera and opinions on oat milk", "knows every climbing gym in town, still scared of ladders", "techno on Fridays, crosswords on Sundays"];
function Onboarding({
  onDone
}) {
  const {
    Chip,
    Button,
    StepDots,
    CheckRow,
    VibeCard,
    IconButton,
    Icon
  } = OB_NS;
  const [step, setStep] = React.useState(0);
  const [picked, setPicked] = React.useState(["beer", "hiking"]);
  const [vibe, setVibe] = React.useState(0);
  const [fade, setFade] = React.useState(1);
  const [adult, setAdult] = React.useState(false);
  const toggle = i => setPicked(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]);
  const reroll = () => {
    setFade(0);
    setTimeout(() => {
      setVibe(v => (v + 1) % VIBES.length);
      setFade(1);
    }, 160);
  };
  const titles = ["What are you into?", "Who catches your eye", "Your vibe card"];
  const ready = step === 0 ? picked.length >= 3 : step === 2 ? adult : true;
  const cta = step === 0 ? picked.length >= 3 ? "That's me" : `Pick ${3 - picked.length} more` : step === 1 ? "Got it" : "Enter the map";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "var(--background)",
      display: "flex",
      flexDirection: "column",
      padding: "62px 16px 34px",
      boxSizing: "border-box"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      height: 44
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "arrow-left",
    label: "Back",
    variant: "ghost",
    onClick: () => setStep(s => Math.max(0, s - 1)),
    style: {
      visibility: step ? "visible" : "hidden"
    }
  }), /*#__PURE__*/React.createElement(StepDots, {
    count: 3,
    active: step
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44
    }
  })), /*#__PURE__*/React.createElement("div", {
    key: step,
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 16,
      paddingTop: 24,
      animation: "ob-in var(--dur-default) var(--ease-spring)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "t-mono",
    style: {
      color: "var(--fg-2)"
    }
  }, "step ", step + 1, " of 3"), /*#__PURE__*/React.createElement("h1", {
    className: "t-large-title",
    style: {
      margin: 0
    }
  }, titles[step]), step === 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
    className: "t-body",
    style: {
      margin: 0,
      color: "var(--fg-2)"
    }
  }, "Pick at least 3. This is what a match is scored on."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      paddingTop: 8
    }
  }, INTERESTS.map(i => /*#__PURE__*/React.createElement(Chip, {
    key: i,
    selected: picked.includes(i),
    onClick: () => toggle(i)
  }, i)))), step === 1 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
    className: "t-body",
    style: {
      margin: 0,
      color: "var(--fg-2)"
    }
  }, "No photos here. Not yours, not theirs."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10,
      paddingTop: 8
    }
  }, [["lock", "Trains on your phone", "Your attraction profile lives on this device. Photos never leave it."], ["shield-check", "Only a number travels", "A compatibility score is all anyone else ever gets."], ["eye-off", "Nobody sees a face", "Identity is a two-line vibe. You decide the rest in person."]].map(([ic, t, d]) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      display: "flex",
      gap: 14,
      padding: 16,
      borderRadius: 24,
      background: "var(--surface-card)",
      boxShadow: "var(--shadow-3)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 999,
      background: "var(--surface-3)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "var(--glow)",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: ic,
    size: 18,
    strokeWidth: 1.75
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "t-headline"
  }, t), /*#__PURE__*/React.createElement("div", {
    className: "t-footnote",
    style: {
      marginTop: 2
    }
  }, d))))), /*#__PURE__*/React.createElement("span", {
    className: "t-mono",
    style: {
      color: "var(--fg-3)"
    }
  }, "production path \xB7 simulated in this build")), step === 2 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
    className: "t-body",
    style: {
      margin: 0,
      color: "var(--fg-2)"
    }
  }, "This is all a match sees. It's your opening line, too."), /*#__PURE__*/React.createElement("div", {
    className: "light",
    style: {
      background: "transparent",
      opacity: fade,
      transition: "opacity 160ms ease",
      paddingTop: 8
    }
  }, /*#__PURE__*/React.createElement(VibeCard, {
    eyebrow: "your vibe",
    intent: picked[0],
    quote: VIBES[vibe]
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Button, {
    variant: "tertiary",
    size: "md",
    leadingIcon: "shuffle",
    onClick: reroll
  }, "Reroll")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto"
    }
  }, /*#__PURE__*/React.createElement(CheckRow, {
    label: "I'm 18 or older",
    description: "Required. There are no photos, so we ask.",
    checked: adult,
    onToggle: () => setAdult(!adult)
  })))), /*#__PURE__*/React.createElement(Button, {
    fullWidth: true,
    disabled: !ready,
    variant: "primary",
    onClick: () => step < 2 ? setStep(step + 1) : onDone({
      interests: picked,
      vibe: VIBES[vibe]
    }),
    style: {
      marginTop: 16
    }
  }, cta));
}
Object.assign(window, {
  Onboarding,
  VIBES
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/Onboarding.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/ios-frame.jsx
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)
// Copied omelette starter. Re-running copy_starter_component with this kind overwrites this file with the latest version (page content is unaffected).

/* BEGIN USAGE */
// iOS.jsx — Simplified iOS 26 (Liquid Glass) device frame
// Based on the iOS 26 UI Kit + Figma status bar spec. No assets, no deps.
// Exports (to window): IOSDevice, IOSStatusBar, IOSNavBar, IOSGlassPill, IOSList, IOSListRow, IOSKeyboard
//
// Usage — wrap your screen content in <IOSDevice> to get the bezel, status bar
// and home indicator (props: title, dark, keyboard):
//
//   <IOSDevice title="Settings">
//     ...your screen content...
//   </IOSDevice>
//   <IOSDevice dark title="Search" keyboard>…</IOSDevice>
/* END USAGE */

// ─────────────────────────────────────────────────────────────
// Status bar
// ─────────────────────────────────────────────────────────────
function IOSStatusBar({
  dark = false,
  time = '9:41'
}) {
  const c = dark ? '#fff' : '#000';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 154,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '21px 24px 19px',
      boxSizing: 'border-box',
      position: 'relative',
      zIndex: 20,
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 22,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 1.5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: '-apple-system, "SF Pro", system-ui',
      fontWeight: 590,
      fontSize: 17,
      lineHeight: '22px',
      color: c
    }
  }, time)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 22,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      paddingTop: 1,
      paddingRight: 1
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "19",
    height: "12",
    viewBox: "0 0 19 12"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "0",
    y: "7.5",
    width: "3.2",
    height: "4.5",
    rx: "0.7",
    fill: c
  }), /*#__PURE__*/React.createElement("rect", {
    x: "4.8",
    y: "5",
    width: "3.2",
    height: "7",
    rx: "0.7",
    fill: c
  }), /*#__PURE__*/React.createElement("rect", {
    x: "9.6",
    y: "2.5",
    width: "3.2",
    height: "9.5",
    rx: "0.7",
    fill: c
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14.4",
    y: "0",
    width: "3.2",
    height: "12",
    rx: "0.7",
    fill: c
  })), /*#__PURE__*/React.createElement("svg", {
    width: "17",
    height: "12",
    viewBox: "0 0 17 12"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M8.5 3.2C10.8 3.2 12.9 4.1 14.4 5.6L15.5 4.5C13.7 2.7 11.2 1.5 8.5 1.5C5.8 1.5 3.3 2.7 1.5 4.5L2.6 5.6C4.1 4.1 6.2 3.2 8.5 3.2Z",
    fill: c
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8.5 6.8C9.9 6.8 11.1 7.3 12 8.2L13.1 7.1C11.8 5.9 10.2 5.1 8.5 5.1C6.8 5.1 5.2 5.9 3.9 7.1L5 8.2C5.9 7.3 7.1 6.8 8.5 6.8Z",
    fill: c
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "8.5",
    cy: "10.5",
    r: "1.5",
    fill: c
  })), /*#__PURE__*/React.createElement("svg", {
    width: "27",
    height: "13",
    viewBox: "0 0 27 13"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "0.5",
    y: "0.5",
    width: "23",
    height: "12",
    rx: "3.5",
    stroke: c,
    strokeOpacity: "0.35",
    fill: "none"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "2",
    y: "2",
    width: "20",
    height: "9",
    rx: "2",
    fill: c
  }), /*#__PURE__*/React.createElement("path", {
    d: "M25 4.5V8.5C25.8 8.2 26.5 7.2 26.5 6.5C26.5 5.8 25.8 4.8 25 4.5Z",
    fill: c,
    fillOpacity: "0.4"
  }))));
}

// ─────────────────────────────────────────────────────────────
// Liquid glass pill — blur + tint + shine
// ─────────────────────────────────────────────────────────────
function IOSGlassPill({
  children,
  dark = false,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 44,
      minWidth: 44,
      borderRadius: 9999,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: dark ? '0 2px 6px rgba(0,0,0,0.35), 0 6px 16px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.07), 0 3px 10px rgba(0,0,0,0.06)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 9999,
      backdropFilter: 'blur(12px) saturate(180%)',
      WebkitBackdropFilter: 'blur(12px) saturate(180%)',
      background: dark ? 'rgba(120,120,128,0.28)' : 'rgba(255,255,255,0.5)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 9999,
      boxShadow: dark ? 'inset 1.5px 1.5px 1px rgba(255,255,255,0.15), inset -1px -1px 1px rgba(255,255,255,0.08)' : 'inset 1.5px 1.5px 1px rgba(255,255,255,0.7), inset -1px -1px 1px rgba(255,255,255,0.4)',
      border: dark ? '0.5px solid rgba(255,255,255,0.15)' : '0.5px solid rgba(0,0,0,0.06)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 1,
      display: 'flex',
      alignItems: 'center',
      padding: '0 4px'
    }
  }, children));
}

// ─────────────────────────────────────────────────────────────
// Navigation bar — glass pills + large title
// ─────────────────────────────────────────────────────────────
function IOSNavBar({
  title = 'Title',
  dark = false,
  trailingIcon = true
}) {
  const muted = dark ? 'rgba(255,255,255,0.6)' : '#404040';
  const text = dark ? '#fff' : '#000';
  const pillIcon = content => /*#__PURE__*/React.createElement(IOSGlassPill, {
    dark: dark
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, content));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      paddingTop: 62,
      paddingBottom: 10,
      position: 'relative',
      zIndex: 5
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px'
    }
  }, pillIcon(/*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "20",
    viewBox: "0 0 12 20",
    fill: "none",
    style: {
      marginLeft: -1
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M10 2L2 10l8 8",
    stroke: muted,
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }))), trailingIcon && pillIcon(/*#__PURE__*/React.createElement("svg", {
    width: "22",
    height: "6",
    viewBox: "0 0 22 6"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "3",
    cy: "3",
    r: "2.5",
    fill: muted
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "3",
    r: "2.5",
    fill: muted
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "19",
    cy: "3",
    r: "2.5",
    fill: muted
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 16px',
      fontFamily: '-apple-system, system-ui',
      fontSize: 34,
      fontWeight: 700,
      lineHeight: '41px',
      color: text,
      letterSpacing: 0.4
    }
  }, title));
}

// ─────────────────────────────────────────────────────────────
// Grouped list (inset card, r:26) + row (52px)
// ─────────────────────────────────────────────────────────────
function IOSListRow({
  title,
  detail,
  icon,
  chevron = true,
  isLast = false,
  dark = false
}) {
  const text = dark ? '#fff' : '#000';
  const sec = dark ? 'rgba(235,235,245,0.6)' : 'rgba(60,60,67,0.6)';
  const ter = dark ? 'rgba(235,235,245,0.3)' : 'rgba(60,60,67,0.3)';
  const sep = dark ? 'rgba(84,84,88,0.65)' : 'rgba(60,60,67,0.12)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      minHeight: 52,
      padding: '0 16px',
      position: 'relative',
      fontFamily: '-apple-system, system-ui',
      fontSize: 17,
      letterSpacing: -0.43
    }
  }, icon && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 7,
      background: icon,
      marginRight: 12,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      color: text
    }
  }, title), detail && /*#__PURE__*/React.createElement("span", {
    style: {
      color: sec,
      marginRight: 6
    }
  }, detail), chevron && /*#__PURE__*/React.createElement("svg", {
    width: "8",
    height: "14",
    viewBox: "0 0 8 14",
    style: {
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M1 1l6 6-6 6",
    stroke: ter,
    strokeWidth: "2",
    fill: "none",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })), !isLast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      left: icon ? 58 : 16,
      height: 0.5,
      background: sep
    }
  }));
}
function IOSList({
  header,
  children,
  dark = false
}) {
  const hc = dark ? 'rgba(235,235,245,0.6)' : 'rgba(60,60,67,0.6)';
  const bg = dark ? '#1C1C1E' : '#fff';
  return /*#__PURE__*/React.createElement("div", null, header && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: '-apple-system, system-ui',
      fontSize: 13,
      color: hc,
      textTransform: 'uppercase',
      padding: '8px 36px 6px',
      letterSpacing: -0.08
    }
  }, header), /*#__PURE__*/React.createElement("div", {
    style: {
      background: bg,
      borderRadius: 26,
      margin: '0 16px',
      overflow: 'hidden'
    }
  }, children));
}

// ─────────────────────────────────────────────────────────────
// Device frame
// ─────────────────────────────────────────────────────────────
function IOSDevice({
  children,
  width = 402,
  height = 874,
  dark = false,
  title,
  keyboard = false
}) {
  return (
    /*#__PURE__*/
    // data-om-starter: inert presence marker — Claude Design's starter-usage
    // probe reads it; it renders nothing. Keep it on this root element.
    React.createElement("div", {
      "data-om-starter": "ios-frame",
      style: {
        width,
        height,
        borderRadius: 48,
        overflow: 'hidden',
        position: 'relative',
        background: dark ? '#000' : '#F2F2F7',
        boxShadow: '0 40px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.12)',
        fontFamily: '-apple-system, system-ui, sans-serif',
        WebkitFontSmoothing: 'antialiased'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        top: 11,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 126,
        height: 37,
        borderRadius: 24,
        background: '#000',
        zIndex: 50
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10
      }
    }, /*#__PURE__*/React.createElement(IOSStatusBar, {
      dark: dark
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }
    }, title !== undefined && /*#__PURE__*/React.createElement(IOSNavBar, {
      title: title,
      dark: dark
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        overflow: 'auto'
      }
    }, children), keyboard && /*#__PURE__*/React.createElement(IOSKeyboard, {
      dark: dark
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        height: 34,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingBottom: 8,
        pointerEvents: 'none'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 139,
        height: 5,
        borderRadius: 100,
        background: dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.25)'
      }
    })))
  );
}

// ─────────────────────────────────────────────────────────────
// Keyboard — iOS 26 liquid glass
// ─────────────────────────────────────────────────────────────
function IOSKeyboard({
  dark = false
}) {
  const glyph = dark ? 'rgba(255,255,255,0.7)' : '#595959';
  const sugg = dark ? 'rgba(255,255,255,0.6)' : '#333';
  const keyBg = dark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.85)';

  // special-key icons
  const icons = {
    shift: /*#__PURE__*/React.createElement("svg", {
      width: "19",
      height: "17",
      viewBox: "0 0 19 17"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M9.5 1L1 9.5h4.5V16h8V9.5H18L9.5 1z",
      fill: glyph
    })),
    del: /*#__PURE__*/React.createElement("svg", {
      width: "23",
      height: "17",
      viewBox: "0 0 23 17"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M7 1h13a2 2 0 012 2v11a2 2 0 01-2 2H7l-6-7.5L7 1z",
      fill: "none",
      stroke: glyph,
      strokeWidth: "1.6",
      strokeLinejoin: "round"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M10 5l7 7M17 5l-7 7",
      stroke: glyph,
      strokeWidth: "1.6",
      strokeLinecap: "round"
    })),
    ret: /*#__PURE__*/React.createElement("svg", {
      width: "20",
      height: "14",
      viewBox: "0 0 20 14"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M18 1v6H4m0 0l4-4M4 7l4 4",
      fill: "none",
      stroke: "#fff",
      strokeWidth: "1.8",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }))
  };
  const key = (content, {
    w,
    flex,
    ret,
    fs = 25,
    k
  } = {}) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      height: 42,
      borderRadius: 8.5,
      flex: flex ? 1 : undefined,
      width: w,
      minWidth: 0,
      background: ret ? '#08f' : keyBg,
      boxShadow: '0 1px 0 rgba(0,0,0,0.075)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, "SF Compact", system-ui',
      fontSize: fs,
      fontWeight: 458,
      color: ret ? '#fff' : glyph
    }
  }, content);
  const row = (keys, pad = 0) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6.5,
      justifyContent: 'center',
      padding: `0 ${pad}px`
    }
  }, keys.map(l => key(l, {
    flex: true,
    k: l
  })));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 15,
      borderRadius: 27,
      overflow: 'hidden',
      padding: '11px 0 2px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxShadow: dark ? '0 -2px 20px rgba(0,0,0,0.09)' : '0 -1px 6px rgba(0,0,0,0.018), 0 -3px 20px rgba(0,0,0,0.012)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 27,
      backdropFilter: 'blur(12px) saturate(180%)',
      WebkitBackdropFilter: 'blur(12px) saturate(180%)',
      background: dark ? 'rgba(120,120,128,0.14)' : 'rgba(255,255,255,0.25)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 27,
      boxShadow: dark ? 'inset 1.5px 1.5px 1px rgba(255,255,255,0.15)' : 'inset 1.5px 1.5px 1px rgba(255,255,255,0.7), inset -1px -1px 1px rgba(255,255,255,0.4)',
      border: dark ? '0.5px solid rgba(255,255,255,0.15)' : '0.5px solid rgba(0,0,0,0.06)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 20,
      alignItems: 'center',
      padding: '8px 22px 13px',
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative'
    }
  }, ['"The"', 'the', 'to'].map((w, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, i > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      height: 25,
      background: '#ccc',
      opacity: 0.3
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      textAlign: 'center',
      fontFamily: '-apple-system, system-ui',
      fontSize: 17,
      color: sugg,
      letterSpacing: -0.43,
      lineHeight: '22px'
    }
  }, w)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 13,
      padding: '0 6.5px',
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative'
    }
  }, row(['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p']), row(['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], 20), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14.25,
      alignItems: 'center'
    }
  }, key(icons.shift, {
    w: 45,
    k: 'shift'
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6.5,
      flex: 1
    }
  }, ['z', 'x', 'c', 'v', 'b', 'n', 'm'].map(l => key(l, {
    flex: true,
    k: l
  }))), key(icons.del, {
    w: 45,
    k: 'del'
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      alignItems: 'center'
    }
  }, key('ABC', {
    w: 92.25,
    fs: 18,
    k: 'abc'
  }), key('', {
    flex: true,
    k: 'space'
  }), key(icons.ret, {
    w: 92.25,
    ret: true,
    k: 'ret'
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 56,
      width: '100%',
      position: 'relative'
    }
  }));
}
Object.assign(window, {
  IOSDevice,
  IOSStatusBar,
  IOSNavBar,
  IOSGlassPill,
  IOSList,
  IOSListRow,
  IOSKeyboard
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/ios-frame.jsx", error: String((e && e.message) || e) }); }

__ds_ns.BUCKETS = __ds_scope.BUCKETS;

__ds_ns.BucketLabel = __ds_scope.BucketLabel;

__ds_ns.CompassDial = __ds_scope.CompassDial;

__ds_ns.Countdown = __ds_scope.Countdown;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.ICONS = __ds_scope.ICONS;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Monogram = __ds_scope.Monogram;

__ds_ns.StepDots = __ds_scope.StepDots;

__ds_ns.VibeCard = __ds_scope.VibeCard;

__ds_ns.MatchCard = __ds_scope.MatchCard;

__ds_ns.StatusPill = __ds_scope.StatusPill;

__ds_ns.CheckRow = __ds_scope.CheckRow;

__ds_ns.Chip = __ds_scope.Chip;

__ds_ns.Segmented = __ds_scope.Segmented;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.ZoneGlow = __ds_scope.ZoneGlow;

__ds_ns.Sheet = __ds_scope.Sheet;

})();
