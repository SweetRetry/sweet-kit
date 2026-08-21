import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import path from "node:path"

interface Credentials {
  accessToken: string
}

const configRoot =
  process.env.SWEET_KIT_CONFIG_DIR ??
  path.join(process.env.XDG_CONFIG_HOME ?? path.join(homedir(), ".config"), "sweet-kit")
const credentialsPath = path.join(configRoot, "credentials.json")

export async function readAccessToken(): Promise<string | null> {
  try {
    const value = JSON.parse(await readFile(credentialsPath, "utf8")) as Partial<Credentials>
    return typeof value.accessToken === "string" ? value.accessToken : null
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null
    }
    throw error
  }
}

export async function writeAccessToken(accessToken: string): Promise<void> {
  await mkdir(configRoot, { recursive: true, mode: 0o700 })
  await writeFile(credentialsPath, `${JSON.stringify({ accessToken }, null, 2)}\n`, {
    mode: 0o600,
  })
}

export async function clearAccessToken(): Promise<void> {
  await rm(credentialsPath, { force: true })
}
