import { access, constants } from 'node:fs'
import { mkdir, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve, sep } from 'node:path'
import { promisify } from 'node:util'
import { Exception } from '@adonisjs/core/exceptions'
import type { MultipartFile } from '@adonisjs/bodyparser/types'
import sharp from 'sharp'
import { fotosDir } from '#config/fotos'

const accessFile = promisify(access)
const MAX_EDGE = 800
const WEBP_QUALITY = 80

/**
 * Profile photos live next to elemento photos, under `perfiles/<id>/foto.webp`.
 * The database stores only the relative path from `rutaDe`.
 */
export default class FotoPerfilService {
  rutaDe(idUsuario: number) {
    this.assertId(idUsuario)
    return `perfiles/${idUsuario}/foto.webp`
  }

  async guardar(idUsuario: number, archivo: MultipartFile) {
    if (!archivo.tmpPath) {
      throw new Exception('No se recibió la fotografía', {
        status: 422,
        code: 'E_FOTO_VACIA',
      })
    }

    const destino = this.absoluta(this.rutaDe(idUsuario))
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

    return this.rutaDe(idUsuario)
  }

  async eliminar(idUsuario: number) {
    await rm(this.absoluta(this.rutaDe(idUsuario)), { force: true })
  }

  async rutaEnDisco(idUsuario: number, rutaGuardada: string | null) {
    if (rutaGuardada !== this.rutaDe(idUsuario)) {
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

  private assertId(idUsuario: number) {
    if (!Number.isInteger(idUsuario) || idUsuario < 1) {
      throw new Exception('El usuario no existe', { status: 404, code: 'E_ROW_NOT_FOUND' })
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
