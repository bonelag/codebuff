import { existsSync, readFileSync } from 'fs'
import { dirname, isAbsolute, join, resolve } from 'path'

const ENV_PATH_VAR = 'CODEBUFF_ENV_PATH'
const RUNTIME_ENV_PATH_VAR = 'CODEBUFF_RUNTIME_ENV_PATH'

function normalizePath(filePath: string): string {
  return isAbsolute(filePath) ? filePath : resolve(filePath)
}

function getSiblingEnvCandidates(): string[] {
  const explicitPath = process.env[ENV_PATH_VAR]
  if (explicitPath) {
    return [normalizePath(explicitPath)]
  }

  const executablePaths = [process.argv[0], process.execPath]
    .filter((p): p is string => typeof p === 'string' && p.length > 0)
    .map(normalizePath)

  return Array.from(
    new Set(executablePaths.map((filePath) => join(dirname(filePath), '.env'))),
  )
}

function stripInlineComment(value: string): string {
  const commentStart = value.search(/\s#/)
  return commentStart === -1 ? value : value.slice(0, commentStart)
}

function parseValue(rawValue: string): string {
  const value = rawValue.trim()
  if (!value) return ''

  const quote = value[0]
  if (quote === '"' || quote === "'") {
    const end = value.lastIndexOf(quote)
    const quoted = end > 0 ? value.slice(1, end) : value.slice(1)
    if (quote === '"') {
      return quoted
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
    }
    return quoted
  }

  return stripInlineComment(value).trim()
}

function loadEnvFile(envPath: string) {
  const content = readFileSync(envPath, 'utf8')
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const assignment = line.startsWith('export ') ? line.slice(7).trim() : line
    const equalsIndex = assignment.indexOf('=')
    if (equalsIndex <= 0) continue

    const key = assignment.slice(0, equalsIndex).trim()
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue

    process.env[key] = parseValue(assignment.slice(equalsIndex + 1))
  }
}

const isSourceEntrypoint = /\.tsx?$/i.test(process.argv[1] ?? '')
const shouldLoadSiblingEnv = !isSourceEntrypoint || !!process.env[ENV_PATH_VAR]
const envPath = shouldLoadSiblingEnv
  ? getSiblingEnvCandidates().find((candidate) => existsSync(candidate))
  : undefined

if (envPath) {
  loadEnvFile(envPath)
  process.env[RUNTIME_ENV_PATH_VAR] = envPath
}
