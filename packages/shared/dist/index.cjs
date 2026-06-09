"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  slugifyForStrategy: () => slugifyForStrategy
});
module.exports = __toCommonJS(index_exports);

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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  slugifyForStrategy
});
//# sourceMappingURL=index.cjs.map