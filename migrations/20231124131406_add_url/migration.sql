/*
  Warnings:

  - Added the required column `url` to the `Audio` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Audio" ADD COLUMN     "url" TEXT NOT NULL;
