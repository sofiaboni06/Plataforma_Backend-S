import { Exception } from '@adonisjs/core/exceptions'

export function rethrowDatabaseError(error: unknown, fallbackMessage: string): never {
  const code = (error as { code?: string })?.code

  if (code === '23505') {
    throw new Exception('Ya existe un registro con ese nombre o código en el mismo ámbito', {
      status: 409,
      code: 'E_DUPLICATE',
    })
  }

  if (code === '23503') {
    throw new Exception('La relación indicada no existe o está siendo utilizada', {
      status: 409,
      code: 'E_RELATION_CONSTRAINT',
    })
  }

  if (code === '23514') {
    throw new Exception('El valor no cumple una restricción de la base de datos', {
      status: 422,
      code: 'E_CHECK_CONSTRAINT',
    })
  }

  throw error instanceof Exception
    ? error
    : new Exception(fallbackMessage, { status: 500, code: 'E_DATABASE_ERROR' })
}
