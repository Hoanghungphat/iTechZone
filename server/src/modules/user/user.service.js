/**
 * src/modules/user/user.service.js
 */
import bcrypt from 'bcryptjs'
import { findUserById, updateUserById, upsertAddress, deleteAddress } from './user.repository.js'

function safeUser(user) {
  if (!user) return null
  const { password, ...safe } = user
  return safe
}

export async function getProfile(userId) {
  const user = await findUserById(userId)
  if (!user) {
    const err = new Error('Không tìm thấy người dùng')
    err.statusCode = 404
    throw err
  }
  return safeUser(user)
}

export async function updateProfile(userId, { name, phone, avatar, birthday, gender }) {
  const data = {}
  if (name     !== undefined) data.name     = name
  if (phone    !== undefined) data.phone    = phone
  if (avatar   !== undefined) data.avatar   = avatar
  if (birthday !== undefined) data.birthday = birthday ? new Date(birthday) : null
  if (gender   !== undefined) data.gender   = gender

  const user = await updateUserById(userId, data)
  return safeUser(user)
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await findUserById(userId)
  if (!user) {
    const err = new Error('Không tìm thấy người dùng')
    err.statusCode = 404
    throw err
  }
  const matched = await bcrypt.compare(currentPassword, user.password)
  if (!matched) {
    const err = new Error('Mật khẩu hiện tại không đúng')
    err.statusCode = 400
    throw err
  }
  const hashed = await bcrypt.hash(newPassword, 12)
  await updateUserById(userId, { password: hashed })
  return { message: 'Đổi mật khẩu thành công' }
}

export async function saveAddress(userId, addressData) {
  return upsertAddress(userId, addressData)
}

export async function removeAddress(addressId, userId) {
  return deleteAddress(addressId, userId)
}
