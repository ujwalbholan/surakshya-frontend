import { NextResponse } from "next/server"
import { access } from "node:fs/promises"
import { constants } from "node:fs"
import { join } from "node:path"

export async function GET() {
  const modelPath = join(process.cwd(), "public", "models", "wristband.glb")
  try {
    await access(modelPath, constants.F_OK)
    return NextResponse.json({ exists: true })
  } catch {
    return NextResponse.json({ exists: false })
  }
}
