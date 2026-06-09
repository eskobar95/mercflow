// src/slug.ts
var NORDIC_OMIT_REPLACEMENTS = {
  \u00F8: "o",
  \u00D8: "o",
  \u00E5: "a",
  \u00C5: "a",
  \u00E6: "a",
  \u00C6: "a",
  \u00F6: "o",
  \u00D6: "o",
  \u00E4: "a",
  \u00C4: "a"
};
var NORDIC_FULL_REPLACEMENTS = {
  \u00F8: "oe",
  \u00D8: "oe",
  \u00E5: "aa",
  \u00C5: "aa",
  \u00E6: "ae",
  \u00C6: "ae",
  \u00F6: "oe",
  \u00D6: "oe",
  \u00E4: "ae",
  \u00C4: "ae"
};
var ACCENT_REPLACEMENTS = {
  \u00E9: "e",
  \u00C9: "e",
  \u00E8: "e",
  \u00C8: "e",
  \u00EA: "e",
  \u00CA: "e",
  \u00FC: "u",
  \u00DC: "u"
};
function applyReplacements(input, map) {
  let out = "";
  for (const ch of input) {
    out += map[ch] ?? ACCENT_REPLACEMENTS[ch] ?? ch;
  }
  return out;
}
function applyAccentRules(input, strategy) {
  let out = "";
  for (const ch of input) {
    const accent = ACCENT_REPLACEMENTS[ch];
    if (accent) {
      if (strategy === "nordic" && (ch === "\xFC" || ch === "\xDC")) {
        out += "ue";
      } else if (strategy === "nordic" && (ch === "\xF6" || ch === "\xD6")) {
        out += "oe";
      } else if (strategy === "nordic" && (ch === "\xE4" || ch === "\xC4")) {
        out += "ae";
      } else {
        out += accent;
      }
      continue;
    }
    out += ch;
  }
  return out;
}
function slugifyForStrategy(title, strategy) {
  const trimmed = title.trim();
  const nordicMap = strategy === "nordic" ? NORDIC_FULL_REPLACEMENTS : NORDIC_OMIT_REPLACEMENTS;
  const transliterated = applyAccentRules(applyReplacements(trimmed, nordicMap), strategy);
  const withoutCombining = transliterated.normalize("NFD").replace(/\p{M}/gu, "");
  const lower = withoutCombining.toLowerCase();
  const kebab = lower.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return kebab.length > 0 ? kebab : "item";
}
export {
  slugifyForStrategy
};
//# sourceMappingURL=slug.js.map