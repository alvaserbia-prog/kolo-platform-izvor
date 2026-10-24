# Doprinos KOLO sistemu

Hvala što doprinosite zajedničkom dobru KOLO sistema. Ovaj dokument uređuje
pravila doprinosa, u skladu sa **Glavom II (čl. 7 i čl. 8) Pravilnika o KOLO
sistemu v3.7.0**.

## Licenciranje zajedničkog dobra (čl. 7)

- **Softver (kod)** se licencira pod **GNU Affero General Public License v3.0
  (AGPL-3.0-only)** — vidi [`LICENSE`](./LICENSE).
- **Sadržaj** nastao u sistemu (dokumentacija, tekstovi sajta, materijali) se
  licencira pod **Creative Commons Attribution-ShareAlike 4.0 International
  (CC BY-SA 4.0)** — vidi [`LICENSE-CONTENT`](./LICENSE-CONTENT).
- Softver i sadržaj se **ne mogu relicencirati pod restriktivnijim uslovima** —
  dopuštena je samo zamena ekvivalentnim copyleft / share-alike režimom.
- Brend „KOLO" (naziv, logotip, znak, domeni) **nije** deo zajedničkog dobra i
  pod isključivom je kontrolom Fondacije.
- Moralna prava autora ostaju nedirnuta i ne prenose se.

## Developer Certificate of Origin — DCO (čl. 8)

Doprinosi **kodu i dokumentaciji** prihvataju se isključivo pod uslovima
**Developer Certificate of Origin** (vidi [`DCO`](./DCO)). Potpisom potvrđujete
da imate pravo da doprinesete delo pod licencom zajedničkog dobra.

Svaki commit mora da sadrži `Signed-off-by` red. Dodaje se automatski sa:

```
git commit -s -m "Tvoja poruka"
```

Red izgleda ovako:

```
Signed-off-by: Ime Prezime <email@primer.rs>
```

Pull request-ovi čiji commitovi nemaju `Signed-off-by` ne prolaze DCO proveru
(CI) i ne mogu biti spojeni.

## Trajna atribucija (čl. 8)

Doprinosi pripadaju zajedničkom dobru. **Atribucija doprinosa je trajna**:
zapis o doprinosu — uključujući ime/pseudonim i `Signed-off-by` — čuva se u
git istoriji neograničeno i **preživljava anonimizaciju ili brisanje naloga**
na platformi. Ovo je izričit izuzetak od mehanizma brisanja podataka.

## Postupak

1. Napravi granu i izmene.
2. Commituj sa `-s` (DCO sign-off).
3. Otvori Pull Request.
4. Sačekaj da prođu provere (DCO + build).
