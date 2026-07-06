/**
 * Exports wristband.glb matching WristbandModel FallbackTorus + group transform.
 * Run: node scripts/export-wristband-glb.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import * as THREE from 'three'

// GLTFExporter expects browser FileReader in Node.
global.FileReader = class FileReader {
  constructor() {
    this.result = null
    this.onloadend = null
  }
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf
      this.onloadend?.()
    })
  }
}
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '../public/models')
const outFile = path.join(outDir, 'wristband.glb')

const TILT = Math.PI * 0.35

const outerGeo = new THREE.TorusGeometry(1.2, 0.18, 32, 128)
const innerGeo = new THREE.TorusGeometry(1.2, 0.035, 16, 128)

const outerMat = new THREE.MeshStandardMaterial({
  color: 0x3a0d0d,
  metalness: 0.9,
  roughness: 0.12,
  emissive: 0xa31919,
  emissiveIntensity: 0.35,
})

const innerMat = new THREE.MeshStandardMaterial({
  color: 0xff3232,
  metalness: 0.4,
  roughness: 0.25,
  emissive: 0xff0000,
  emissiveIntensity: 1.25,
  transparent: true,
  opacity: 0.9,
})

const group = new THREE.Group()
const outer = new THREE.Mesh(outerGeo, outerMat)
outer.rotation.x = TILT
const inner = new THREE.Mesh(innerGeo, innerMat)
inner.rotation.x = TILT
group.add(outer, inner)
group.position.set(1.9, 0.05, 0)
group.scale.set(1.28, 1.28, 1.28)

fs.mkdirSync(outDir, { recursive: true })

async function main() {
  const exporter = new GLTFExporter()
  const buffer = await exporter.parseAsync(group, { binary: true })
  fs.writeFileSync(outFile, Buffer.from(buffer))
  console.log('Wrote', outFile, `(${fs.statSync(outFile).size} bytes)`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
