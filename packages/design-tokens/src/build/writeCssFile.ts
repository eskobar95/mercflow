import { writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { buildRootStylesheet } from "../lib/buildRootStylesheet.js"

const here = dirname(fileURLToPath(import.meta.url))
const outFile = join(here, "..", "mercflow-tokens.css")
writeFileSync(outFile, buildRootStylesheet(), "utf8")
