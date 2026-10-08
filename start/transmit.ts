import transmit from '@adonisjs/transmit/services/main'

/**
 * Cada usuario solo escucha su bandeja. El token va en el POST de
 * suscripción; el stream de eventos no puede mandar el header bearer.
 */
transmit.authorize<{ id: string }>('notificaciones/:id', (ctx, { id }) => {
  const userId = Number(id)

  return Number.isInteger(userId) && ctx.auth.user?.id === userId
})
