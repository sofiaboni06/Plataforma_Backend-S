import vine from '@vinejs/vine'

const sixDigitCode = vine.string().trim().regex(/^\d{6}$/)
const password = vine.string().minLength(8).maxLength(32)

export const recoverRequestValidator = vine.create({
  email: vine.string().trim().email().maxLength(150),
})

export const recoverVerifyValidator = vine.create({
  email: vine.string().trim().email().maxLength(150),
  code: sixDigitCode,
})

export const recoverResetValidator = vine.create({
  resetToken: vine.string().trim().minLength(20),
  password,
  passwordConfirmation: password.sameAs('password'),
})

export const confirmAuthenticatorValidator = vine.create({
  code: sixDigitCode,
})
