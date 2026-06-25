const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const count = await prisma.banner.count()
  if (count > 0) { console.log('Already seeded:', count, 'banners'); return }

  await prisma.banner.createMany({ data: [
    {
      tag: 'iPhone 15 Pro', title: 'iPhone 15 Pro Max',
      subtitle: 'Chip A17 Pro · Camera 48MP · Titanium',
      price: 34990000, originalPrice: 37990000,
      ctaText: 'Mua ngay', href: '/san-pham/apple-iphone-15-pro-max-256gb',
      image: 'https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-15-pro-max_1__1.png',
      gradient: 'from-dark-900 via-dark-800 to-dark-900', accent: '#e51c1c', sortOrder: 0,
    },
    {
      tag: 'Galaxy AI', title: 'Samsung S24 Ultra',
      subtitle: 'S Pen · 200MP · Snapdragon 8 Gen 3',
      price: 31990000, originalPrice: 34990000,
      ctaText: 'Kham pha', href: '/san-pham/samsung-galaxy-s24-ultra-256gb',
      image: 'https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/s/a/samsung-galaxy-s24-ultra_1.png',
      gradient: 'from-dark-900 via-blue-950 to-dark-900', accent: '#1d4ed8', sortOrder: 1,
    },
    {
      tag: 'iPad Pro M4', title: 'Mong nhat tu truoc den nay',
      subtitle: 'Chip M4 · Man hinh OLED · Ultra Retina XDR',
      price: 26990000, originalPrice: 28990000,
      ctaText: 'Tim hieu them', href: '/san-pham/apple-ipad-pro-m4-11-inch-256gb-wifi',
      image: 'https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/i/p/ipad-pro-m4-11-inch_1.png',
      gradient: 'from-dark-900 via-indigo-950 to-dark-900', accent: '#6366f1', sortOrder: 2,
    },
  ]})
  console.log('Seeded 3 banners OK')
}

main().catch(console.error).finally(() => prisma.$disconnect())
