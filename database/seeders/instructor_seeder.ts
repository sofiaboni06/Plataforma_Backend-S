import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Perfil from '#models/perfil'
import User from '#models/usuario'

export const INSTRUCTOR_PROFILE_NAME = 'Instructor'

const DEMO_USER = {
  nombres: 'Camilo',
  apellidos: 'Instructor',
  tipoDocumento: 'CC',
  numeroDocumento: '1001001005',
  email: 'instructor@correo.com',
  password: '123456',
  idCformacion: 1,
}

/**
 * Cuenta para pedir materiales y equipos. No entrega: eso es Admin bodega.
 * Se puede correr otra vez: si el correo ya existe, no lo toca.
 */
export default class extends BaseSeeder {
  async run() {
    let perfil = await Perfil.query().where('nombre', INSTRUCTOR_PROFILE_NAME).first()

    if (!perfil) {
      perfil = await Perfil.create({
        nombre: INSTRUCTOR_PROFILE_NAME,
        descripcion: 'Pide materiales y equipos para una obra del centro',
        estado: true,
      })
    }

    const user = await User.query().where('email', DEMO_USER.email).first()
    if (user) {
      return
    }

    await User.create({ ...DEMO_USER, idPerfil: perfil.id, estado: true })
  }
}
