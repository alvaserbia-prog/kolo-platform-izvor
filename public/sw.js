/* KOLO service worker — Web Push.
   Prikazuje sistemsku notifikaciju kad stigne push i otvara link na klik.
   Namerno BEZ keširanja/offline logike — služi isključivo za push. */

self.addEventListener("install", () => {
  // Aktiviraj novu verziju odmah, bez čekanja na zatvaranje kartica.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  const naslov = data.naslov || "KOLO";
  const link = data.link || "/pocetna";
  const opcije = {
    body: data.tekst || "",
    icon: "/kolo-icon.png",
    badge: "/kolo-icon.png",
    // Grupiši po CILJU (link), ne po tipu: inače sve poruke — iz svih
    // konverzacija — dele isti tag ("poruka") i tiho preklapaju jedna drugu,
    // pa korisnik vidi i čuje samo prvu. Sada svaki razgovor ima svoj tag.
    tag: `${data.tip || "kolo"}:${link}`,
    // renotify: i kad nov push zameni notifikaciju istog tag-a, ponovo obavesti
    // (zvuk/vibracija) umesto tihe zamene.
    renotify: true,
    data: { link },
  };

  event.waitUntil(self.registration.showNotification(naslov, opcije));
});

// Aplikacija javi (postMessage) kad korisnik pročita poruke za određeni cilj →
// zatvaramo pripadajuće sistemske notifikacije da crvena brojka na ikonici
// padne. OS broji PRIKAZANE notifikacije, a `showNotification` ne nestaje sam,
// pa bez ovoga brojka ostaje i posle čitanja.
self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type !== "zatvori-notifikacije") return;
  event.waitUntil(
    self.registration.getNotifications().then((notifikacije) => {
      for (const n of notifikacije) {
        const link = (n.data && n.data.link) || "";
        // Bez `link` u poruci → zatvori sve; inače samo one čiji cilj odgovara.
        if (!data.link || link === data.link || link.startsWith(data.link)) n.close();
      }
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/pocetna";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((klijenti) => {
        // Ako je aplikacija već otvorena u nekoj kartici — fokusiraj je i navedi na link.
        for (const klijent of klijenti) {
          if ("focus" in klijent) {
            klijent.focus();
            if ("navigate" in klijent) {
              try {
                klijent.navigate(link);
              } catch {
                /* navigate može pući na cross-origin; ignoriši */
              }
            }
            return;
          }
        }
        // Inače otvori novu karticu.
        if (self.clients.openWindow) return self.clients.openWindow(link);
      }),
  );
});
