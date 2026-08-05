/**
 * src/modules/user/user.controller.js
 */
import { getProfile, updateProfile, changePassword, saveAddress, removeAddress } from './user.service.js'
import { successResponse } from '../../core/utils/response.js'

export async function getProfileController(req, res, next) {
  try {
    const user = await getProfile(req.user.id)
    return successResponse(res, user)
  } catch (err) { next(err) }
}

export async function updateProfileController(req, res, next) {
  try {
    const { name, phone, avatar, birthday, gender } = req.body
    const user = await updateProfile(req.user.id, { name, phone, avatar, birthday, gender })
    return successResponse(res, user, 'Cập nhật thông tin thành công')
  } catch (err) { next(err) }
}

export async function changePasswordController(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body
    const result = await changePassword(req.user.id, { currentPassword, newPassword })
    return successResponse(res, result)
  } catch (err) { next(err) }
}

export async function saveAddressController(req, res, next) {
  try {
    const address = await saveAddress(req.user.id, req.body)
    return successResponse(res, address, 'Lưu địa chỉ thành công')
  } catch (err) { next(err) }
}

export async function removeAddressController(req, res, next) {
  try {
    await removeAddress(req.params.id, req.user.id)
    return successResponse(res, null, 'Xoá địa chỉ thành công')
  } catch (err) { next(err) }
}
