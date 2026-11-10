-- Pravilnik o učešću dece čl. 13 st. 2 (set 5.1.2): roditelj pri podnošenju zahteva
-- za potvrdu postojanja deteta pristaje na prikaz pseudonima i uzrasta deteta.
-- Beleži se samo trenutak pristanka. Zatečeni redovi ostaju NULL.
ALTER TABLE "PotvrdaPostojanjaDeteta" ADD COLUMN IF NOT EXISTS "prikazPristanakAt" TIMESTAMP(3);
