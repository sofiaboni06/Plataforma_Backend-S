import { access, constants } from 'node:fs'
import { mkdir, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve, sep } from 'node:path'
import { promisify } from 'node:util'
import { Exception } from '@adonisjs/core/exceptions'
import type { MultipartFile } from '@adonisjs/bodyparser/types'
import sharp from 'sharp'
import { fotosDir } from '#config/fotos'

const accessFile = promisify(access)
const MAX_EDGE = 1600
const WEBP_QUALITY = 80

/**
 * Writes elemento photos as WebP on disk. The database stores the relative
 * path returned by `rutaDe`, never the bytes and never an absolute path.
 */
export default class FotoElementoService {
  rutaDe(idElemento: number) {
    this.assertId(idElemento)
    return `elementos/${idElemento}/foto.webp`
  }

  async guardar(idElemento: number, archivo: MultipartFile) {
    if (!archivo.tmpPath) {
      throw new Exception('No se recibió la fotografía', {
        status: 422,
        code: 'E_FOTO_VACIA',
      })
    }

    const destino = this.absoluta(this.rutaDe(idElemento))
    const temporal = `${destino}.${process.pid}.tmp`
    await mkdir(dirname(destino), { recursive: true })

    let buffer: Buffer
    try {
      buffer = await sharp(archivo.tmpPath, { pages: 1, limitInputPixels: 40_000_000 })
        .rotate()
        .resize({
          width: MAX_EDGE,
          height: MAX_EDGE,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer()
    } catch {
      throw new Exception('No se pudo procesar la fotografía. Use una imagen JPG, PNG o WebP.', {
        status: 422,
        code: 'E_FOTO_PROCESO',
      })
    }

    try {
      await writeFile(temporal, buffer)
      await rm(destino, { force: true })
      await rename(temporal, destino)
    } catch (error) {
      await rm(temporal, { force: true })
      throw error
    }

    return this.rutaDe(idElemento)
  }

  async eliminar(idElemento: number) {
    await rm(this.absoluta(this.rutaDe(idElemento)), { force: true })
  }

  async rutaEnDisco(idElemento: number, rutaGuardada: string | null) {
    if (rutaGuardada !== this.rutaDe(idElemento)) {
      return null
    }

    const absoluta = this.absoluta(rutaGuardada)
    try {
      await accessFile(absoluta, constants.R_OK)
    } catch {
      return null
    }

    return absoluta
  }

  private assertId(idElemento: number) {
    if (!Number.isInteger(idElemento) || idElemento < 1) {
      throw new Exception('El elemento no existe', { status: 404, code: 'E_ROW_NOT_FOUND' })
    }
  }

  private absoluta(rutaRelativa: string) {
    const raiz = resolve(fotosDir)
    const absoluta = resolve(raiz, rutaRelativa)

    if (!absoluta.startsWith(raiz + sep)) {
      throw new Exception('Ruta de fotografía inválida', { status: 400, code: 'E_FOTO_RUTA' })
    }

    return absoluta
  }
}
