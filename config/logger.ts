import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig, syncDestination } from '@adonisjs/core/logger'

const loggerConfig = defineConfig({
  default: 'app',

  loggers: {
    app: {
      enabled: true,

      name: env.get('APP_NAME'),

      level: env.get('LOG_LEVEL'),

      destination: !app.inProduction ? await syncDestination() : undefined,
    },
  },
})

export default loggerConfig

declare module '@adonisjs/core/types' {
  export interface LoggersList extends InferLoggers<typeof loggerConfig> {}
}