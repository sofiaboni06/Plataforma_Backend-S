import vine from '@vinejs/vine'

const email = () => vine.string().email().maxLength(150)
const password = () => vine.string().minLength(8).maxLength(32)

export const signupValidator = vine.create({
  nombres: vine.string().trim().minLength(1).maxLength(100),
  apellidos: vine.string().trim().minLength(1).maxLength(100),
  tipoDocumento: vine.string().trim().minLength(1).maxLength(30),
  numeroDocumento: vine
    .string()
    .trim()
    .minLength(1)
    .maxLength(30)
    .unique({ table: 'usuario', column: 'numero_documento' }),
  email: email().unique({ table: 'usuario', column: 'correo' }),
  password: password(),
  passwordConfirmation: password().sameAs('password'),
  idPerfil: vine.number().positive().exists({ table: 'perfil', column: 'id_perfil' }),
  idCformacion: vine.number().positive().exists({ table: 'c_formacion', column: 'id_cformacion' }),
})

export const loginValidator = vine.create({
  email: vine.string().trim().optional(),
  usuario: vine.string().trim().optional(),
  password: vine.string(),
})

export const updateProfileValidator = vine.create({
  nombres: vine.string().trim().minLength(1).maxLength(100).optional(),
  apellidos: vine.string().trim().minLength(1).maxLength(100).optional(),
  tipoDocumento: vine.string().trim().minLength(1).maxLength(30).optional(),
  numeroDocumento: vine.string().trim().minLength(1).maxLength(30).optional(),
  email: email().optional(),
})

export const changePasswordValidator = vine.create({
  currentPassword: vine.string(),
  password: password(),
  passwordConfirmation: password().sameAs('password'),
})

const adminPassword = () => vine.string().minLength(6).maxLength(32)

export const createUserValidator = vine.create({
  nombres: vine.string().trim().minLength(1).maxLength(100),
  apellidos: vine.string().trim().minLength(1).maxLength(100),
  tipoDocumento: vine.string().trim().minLength(1).maxLength(30),
  numeroDocumento: vine
    .string()
    .trim()
    .minLength(1)
    .maxLength(30)
    .unique({ table: 'usuario', column: 'numero_documento' }),
  email: email().unique({ table: 'usuario', column: 'correo' }),
  password: adminPassword(),
  passwordConfirmation: adminPassword().sameAs('password'),
  idPerfil: vine.number().positive().exists({ table: 'perfil', column: 'id_perfil' }),
  idCformacion: vine.number().positive().exists({ table: 'c_formacion', column: 'id_cformacion' }),
})

export const updateUserValidator = vine.create({
  nombres: vine.string().trim().minLength(1).maxLength(100).optional(),
  apellidos: vine.string().trim().minLength(1).maxLength(100).optional(),
  tipoDocumento: vine.string().trim().minLength(1).maxLength(30).optional(),
  numeroDocumento: vine.string().trim().minLength(1).maxLength(30).optional(),
  email: email().optional(),
  password: adminPassword().optional(),
  passwordConfirmation: vine.string().optional(),
  idPerfil: vine.number().positive().exists({ table: 'perfil', column: 'id_perfil' }).optional(),
  idCformacion: vine
    .number()
    .positive()
    .exists({ table: 'c_formacion', column: 'id_cformacion' })
    .optional(),
  active: vine.boolean().optional(),
})
