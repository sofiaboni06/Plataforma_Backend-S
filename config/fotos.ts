import { isAbsolute } from 'node:path'
import app from '@adonisjs/core/services/app'
import env from '#start/env'

/**
 * Directory that stores elemento photos. The database keeps only the relative
 * path. In production this must be an absolute path on a disk that survives
 * a redeploy of the application.
 */
function resolveFotosDir() {
  const configured = env.get('FOTOS_DIR')

  if (env.get('NODE_ENV') === 'production') {
    if (!configured || !isAbsolute(configured)) {
      throw new Error(
        'FOTOS_DIR debe ser una ruta absoluta en producción, por ejemplo /datos/inventario'
      )
    }

    return configured
  }

  if (!configured) {
    return app.makePath('storage', 'fotos')
  }

  return isAbsolute(configured) ? configured : app.makePath(configured)
}

export const fotosDir = resolveFotosDir()
