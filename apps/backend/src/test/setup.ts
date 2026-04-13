import path from "node:path"
import { loadEnvFile } from "node:process"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
loadEnvFile(path.resolve(__dirname, '../../.env.test'))
