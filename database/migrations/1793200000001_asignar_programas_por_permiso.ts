import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * El dump solo dejaba asignar programas a perfiles cuyo nombre empieza
 * por Instructor o Coordinador. La asignación la decide el permiso del perfil.
 */
export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      await db.rawQuery(
        'DROP TRIGGER IF EXISTS trg_upf_perfil_instructor ON public.usuario_programa_formacion'
      )
    })
  }

  async down() {}
}
