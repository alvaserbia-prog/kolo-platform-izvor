-- Adresa gazdinstva (Pravilnik o gazdinstvima čl. 4 t. 3, set 4.7.5): obavezna za
-- novu prijavu, vidi je samo administratorski tim. Zatečeni redovi ostaju NULL.
ALTER TABLE "Gazdinstvo" ADD COLUMN IF NOT EXISTS "adresa" TEXT;
