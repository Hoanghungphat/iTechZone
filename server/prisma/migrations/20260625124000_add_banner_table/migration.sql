-- CreateTable
CREATE TABLE "banners" (
    "id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL DEFAULT '',
    "price" INTEGER NOT NULL DEFAULT 0,
    "originalPrice" INTEGER NOT NULL DEFAULT 0,
    "ctaText" TEXT NOT NULL DEFAULT 'Khám phá',
    "href" TEXT NOT NULL DEFAULT '/',
    "image" TEXT NOT NULL DEFAULT '',
    "gradient" TEXT NOT NULL DEFAULT 'from-dark-900 via-dark-800 to-dark-900',
    "accent" TEXT NOT NULL DEFAULT '#e51c1c',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);
