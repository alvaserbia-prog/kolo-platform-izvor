-- Registar rizika 2026-10, U2: zadružni admin kao treća rola (Pravilnik o zadrugama čl. 16).
ALTER TYPE "AdminNivo" ADD VALUE IF NOT EXISTS 'ZADRUGA';
