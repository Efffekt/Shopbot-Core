-- Migration 016: Add checksum column to documents table
-- The column was defined in 010's CREATE TABLE IF NOT EXISTS, but if the table
-- already existed (created manually), the column was never added.

ALTER TABLE documents ADD COLUMN IF NOT EXISTS checksum TEXT;
