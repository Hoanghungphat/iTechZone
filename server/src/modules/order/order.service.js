/**
 * src/modules/order/order.service.js
 */
import prisma from '../../configs/database.js'
import { createOrder, findOrdersByUser, findOrderById, cancelOrder } from './order.repository.js'

export async function placeOrder(userId, {
  shippingName, shippingPhone, shippingAddress,
  paymentMethod = 'cod', note,
  items: bodyItems, // items gửi trực tiếp từ frontend (khi chưa sync DB cart)
}) {
  // Validate thông tin giao hàng trước
  if (!shippingName || !shippingPhone || !shippingAddress) {
    const err = new Error('Vui lòng cung cấp đầy đủ thông tin giao hàng')
    err.statusCode = 400
    throw err
  }

  let items

  if (bodyItems && bodyItems.length > 0) {
    // Dùng items từ request body — validate từng sản phẩm trong DB
    const productIds = bodyItems.map(i => i.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    })

    for (const bi of bodyItems) {
      const product = products.find(p => p.id === bi.productId)
      if (!product || product.status !== 'active') {
        const err = new Error(`Sản phẩm không tồn tại hoặc ngừng bán`)
        err.statusCode = 400
        throw err
      }
      if (product.stock < bi.quantity) {
        const err = new Error(`Sản phẩm "${product.name}" không đủ hàng (còn ${product.stock})`)
        err.statusCode = 400
        throw err
      }
    }

    items = bodyItems.map(bi => ({
      productId:       bi.productId,
      productName:     bi.productName,
      productImage:    bi.productImage || null,
      variant:         bi.variant || null,
      variantColor:    bi.variantColor    || null,
      variantCapacity: bi.variantCapacity || null,
      quantity:        bi.quantity,
      price:           bi.price,
    }))
  } else {
    // Đọc từ DB cart
    const cartItems = await prisma.cartItem.findMany({
      where:   { userId },
      include: { product: true },
    })

    if (cartItems.length === 0) {
      const err = new Error('Giỏ hàng trống')
      err.statusCode = 400
      throw err
    }

    for (const item of cartItems) {
      if (item.product.stock < item.quantity) {
        const err = new Error(`Sản phẩm "${item.product.name}" không đủ hàng (còn ${item.product.stock})`)
        err.statusCode = 400
        throw err
      }
    }

    items = cartItems.map(i => ({
      productId:    i.productId,
      productName:  i.product.name,
      productImage: i.product.image || i.product.thumbnail,
      variant:      i.variant,
      quantity:     i.quantity,
      price:        i.product.price,
    }))
  }

  const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const orderData = { totalAmount, shippingName, shippingPhone, shippingAddress, paymentMethod, note }

  return createOrder(userId, orderData, items)
}

export async function getMyOrders(userId) {
  return findOrdersByUser(userId)
}

export async function getOrderDetail(orderId, userId) {
  const order = await findOrderById(orderId, userId)
  if (!order) {
    const err = new Error('Không tìm thấy đơn hàng')
    err.statusCode = 404
    throw err
  }
  return order
}

export async function cancelMyOrder(orderId, userId) {
  return cancelOrder(orderId, userId)
}

export async function submitPaymentProof(orderId, userId, proofImage) {
  // Kiểm tra đơn hàng thuộc user này
  const order = await prisma.order.findFirst({ where: { id: orderId, userId } })
  if (!order) throw Object.assign(new Error('Không tìm thấy đơn hàng'), { status: 404 })

  return prisma.order.update({
    where: { id: orderId },
    data:  {
      paymentProof:  proofImage,
      paymentStatus: 'submitted',  // đạng chờ staff xác nhận
    },
  })
}

export async function confirmReceipt(orderId, userId) {
  const order = await prisma.order.findFirst({ where: { id: orderId, userId } })
  if (!order) {
    const err = new Error('Không tìm thấy đơn hàng')
    err.statusCode = 404; throw err
  }
  if (order.status !== 'shipping') {
    const err = new Error('Đơn hàng chưa ở trạng thái đang giao')
    err.statusCode = 400; throw err
  }
  if (order.customerConfirmed) {
    const err = new Error('Bạn đã xác nhận nhận hàng rồi')
    err.statusCode = 400; throw err
  }
  return prisma.order.update({
    where: { id: orderId },
    data:  { customerConfirmed: true },
  })
}
