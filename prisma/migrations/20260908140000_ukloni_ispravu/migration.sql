-- Knjigovodstvena isprava uz prijavu pokroviteljstva je UKINUTA (odluka
-- vlasnika, 08.09.2026). Kolona je zivela jedan dan i nijedna prijava je nije
-- popunila: uvedena je uz robu i usluge, koji su ukinuti istog dana, pa je
-- kratko stajala uz novcanu prijavu i odmah uklonjena.
--
-- Razlog uklanjanja: donacija se izvrsava uplatom na racun Fondacije (cl. 8),
-- pa se iz izvoda uvek vidi ko je uplatio; uz maticni broj i PIB iz prijave to
-- je potpun podatak. Isprava bi bila drugi dokaz iste cinjenice, i to onaj koji
-- prilaze strana koja ima korist.
ALTER TABLE "PokroviteljPrijava" DROP COLUMN IF EXISTS "ispravaSlika";
