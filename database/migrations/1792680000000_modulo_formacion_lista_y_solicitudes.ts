import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Lista maestra desde el anexo Excel (UNSPSC), vigencia única activa,
 * solicitudes por ficha y consolidado de compras. Las tablas del dump v2
 * se reutilizan; solo se agregan columnas que el Excel necesita.
 */
export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      await db.rawQuery(`
        CREATE TABLE IF NOT EXISTS public.carga_lista_maestra (
          id_carga SERIAL PRIMARY KEY,
          id_programa_formacion INTEGER NOT NULL REFERENCES public.programa_formacion(id_programa_formacion) ON UPDATE CASCADE ON DELETE RESTRICT,
          id_usuario_carga INTEGER NOT NULL REFERENCES public.usuario(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
          nombre_archivo VARCHAR(255) NOT NULL,
          ruta_archivo TEXT,
          total_registros INTEGER DEFAULT 0 NOT NULL,
          registros_ok INTEGER DEFAULT 0 NOT NULL,
          registros_error INTEGER DEFAULT 0 NOT NULL,
          estado VARCHAR(20) DEFAULT 'procesando' NOT NULL,
          observaciones TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `)

      await db.rawQuery(`
        CREATE TABLE IF NOT EXISTS public.lista_maestra_material (
          id_lista_maestra SERIAL PRIMARY KEY,
          id_programa_formacion INTEGER NOT NULL REFERENCES public.programa_formacion(id_programa_formacion) ON UPDATE CASCADE ON DELETE RESTRICT,
          codigo_unspsc VARCHAR(20) NOT NULL,
          producto VARCHAR(200) NOT NULL,
          descripcion_tecnica TEXT,
          unidad_medida VARCHAR(50),
          cantidad_base NUMERIC(12,3) DEFAULT 1 NOT NULL,
          caracter VARCHAR(20),
          observaciones TEXT,
          id_carga INTEGER REFERENCES public.carga_lista_maestra(id_carga) ON UPDATE CASCADE ON DELETE SET NULL,
          id_usuario_registro INTEGER REFERENCES public.usuario(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
          estado BOOLEAN DEFAULT TRUE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          CONSTRAINT chk_lm_cantidad CHECK (cantidad_base > 0)
        )
      `)

      await db.rawQuery(`
        ALTER TABLE public.lista_maestra_material
          ADD COLUMN IF NOT EXISTS codigo_unspsc VARCHAR(20),
          ADD COLUMN IF NOT EXISTS producto VARCHAR(200),
          ADD COLUMN IF NOT EXISTS descripcion_tecnica TEXT,
          ADD COLUMN IF NOT EXISTS unidad_medida VARCHAR(50),
          ADD COLUMN IF NOT EXISTS caracter VARCHAR(20),
          ADD COLUMN IF NOT EXISTS id_carga INTEGER,
          ADD COLUMN IF NOT EXISTS observaciones TEXT
      `)

      await db.rawQuery(`
        ALTER TABLE public.lista_maestra_material
          ALTER COLUMN id_elemento DROP NOT NULL
      `)

      await db.rawQuery(`
        UPDATE public.lista_maestra_material lm
        SET
          codigo_unspsc = COALESCE(NULLIF(lm.codigo_unspsc, ''), e.codigo, 'SIN-CODIGO-' || lm.id_lista_maestra),
          producto = COALESCE(NULLIF(lm.producto, ''), e.nombre, 'Material ' || lm.id_lista_maestra)
        FROM public.elemento e
        WHERE lm.id_elemento = e.id_elemento
          AND (lm.codigo_unspsc IS NULL OR lm.producto IS NULL)
      `)

      await db.rawQuery(`
        UPDATE public.lista_maestra_material
        SET
          codigo_unspsc = COALESCE(NULLIF(codigo_unspsc, ''), 'SIN-CODIGO-' || id_lista_maestra),
          producto = COALESCE(NULLIF(producto, ''), 'Material ' || id_lista_maestra)
        WHERE codigo_unspsc IS NULL OR producto IS NULL
      `)

      await db.rawQuery(`
        ALTER TABLE public.lista_maestra_material
          ALTER COLUMN codigo_unspsc SET NOT NULL,
          ALTER COLUMN producto SET NOT NULL
      `)

      await db.rawQuery(`
        ALTER TABLE public.lista_maestra_material
          DROP COLUMN IF EXISTS id_cformacion
      `)

      await db.rawQuery(`
        CREATE TABLE IF NOT EXISTS public.vigencia (
          anio INTEGER PRIMARY KEY,
          activa BOOLEAN DEFAULT FALSE NOT NULL,
          fecha_apertura DATE,
          fecha_cierre DATE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          CONSTRAINT chk_vigencia_anio CHECK (anio BETWEEN 2020 AND 2100)
        )
      `)

      await db.rawQuery(`
        CREATE UNIQUE INDEX IF NOT EXISTS uq_vigencia_una_activa
          ON public.vigencia ((TRUE)) WHERE activa
      `)

      await db.rawQuery(`
        CREATE TABLE IF NOT EXISTS public.solicitud_material_programa (
          id_solicitud_programa SERIAL PRIMARY KEY,
          id_usuario_instructor INTEGER NOT NULL REFERENCES public.usuario(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
          id_programa_formacion INTEGER NOT NULL REFERENCES public.programa_formacion(id_programa_formacion) ON UPDATE CASCADE ON DELETE RESTRICT,
          id_ficha INTEGER NOT NULL REFERENCES public.ficha(id_ficha) ON UPDATE CASCADE ON DELETE RESTRICT,
          vigencia INTEGER NOT NULL REFERENCES public.vigencia(anio) ON UPDATE CASCADE ON DELETE RESTRICT,
          estado VARCHAR(20) DEFAULT 'borrador' NOT NULL,
          observacion TEXT,
          id_usuario_aprobador INTEGER REFERENCES public.usuario(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
          observacion_decision TEXT,
          fecha_envio TIMESTAMP WITH TIME ZONE,
          fecha_decision TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `)

      await db.rawQuery(`
        CREATE TABLE IF NOT EXISTS public.detalle_solicitud_programa (
          id_detalle_solicitud SERIAL PRIMARY KEY,
          id_solicitud_programa INTEGER NOT NULL REFERENCES public.solicitud_material_programa(id_solicitud_programa) ON UPDATE CASCADE ON DELETE CASCADE,
          id_programa_formacion INTEGER NOT NULL,
          id_lista_maestra INTEGER NOT NULL REFERENCES public.lista_maestra_material(id_lista_maestra) ON UPDATE CASCADE ON DELETE RESTRICT,
          cantidad_maestra_referencia NUMERIC(12,3),
          cantidad_solicitada NUMERIC(12,3) NOT NULL,
          cantidad_aprobada NUMERIC(12,3),
          estado VARCHAR(20) DEFAULT 'pendiente' NOT NULL,
          observacion_coordinador TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `)

      await db.rawQuery(`
        CREATE TABLE IF NOT EXISTS public.solicitud_historial (
          id_historial SERIAL PRIMARY KEY,
          id_solicitud_programa INTEGER NOT NULL REFERENCES public.solicitud_material_programa(id_solicitud_programa) ON UPDATE CASCADE ON DELETE CASCADE,
          estado_anterior VARCHAR(20),
          estado_nuevo VARCHAR(20) NOT NULL,
          id_usuario INTEGER REFERENCES public.usuario(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
          comentario TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `)

      await db.rawQuery(`
        CREATE TABLE IF NOT EXISTS public.proceso_compra (
          id_proceso_compra SERIAL PRIMARY KEY,
          vigencia INTEGER NOT NULL REFERENCES public.vigencia(anio) ON UPDATE CASCADE ON DELETE RESTRICT,
          codigo_proceso VARCHAR(50) NOT NULL UNIQUE,
          descripcion TEXT,
          id_usuario_compras INTEGER NOT NULL REFERENCES public.usuario(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
          estado VARCHAR(20) DEFAULT 'borrador' NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `)

      await db.rawQuery(`
        CREATE TABLE IF NOT EXISTS public.proceso_compra_origen (
          id_proceso_origen SERIAL PRIMARY KEY,
          id_proceso_compra INTEGER NOT NULL REFERENCES public.proceso_compra(id_proceso_compra) ON UPDATE CASCADE ON DELETE CASCADE,
          id_detalle_solicitud INTEGER NOT NULL UNIQUE REFERENCES public.detalle_solicitud_programa(id_detalle_solicitud) ON UPDATE CASCADE ON DELETE RESTRICT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `)
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.rawQuery('DROP TABLE IF EXISTS public.proceso_compra_origen')
      await db.rawQuery('DROP TABLE IF EXISTS public.proceso_compra')
      await db.rawQuery('DROP TABLE IF EXISTS public.solicitud_historial')
      await db.rawQuery('DROP TABLE IF EXISTS public.detalle_solicitud_programa')
      await db.rawQuery('DROP TABLE IF EXISTS public.solicitud_material_programa')
      await db.rawQuery('DROP TABLE IF EXISTS public.vigencia')
    })
  }
}
