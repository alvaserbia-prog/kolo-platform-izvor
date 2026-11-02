/**
 * Lampica — krug sa brojem uz odeljak, tab ili pod-tab.
 *
 * Žuto = „ovde ima nešto novo što čeka tvoju radnju"; crveno (`hitno`) = „rok je
 * prošao" i ni za šta drugo — isto kao krug uz linkove u sidebaru (odluka vlasnika,
 * 24.10.2026), inače crveno prestaje da se primećuje. Na nuli se ne crta — krug koji
 * stalno stoji takođe prestaje da se primećuje. Zlatna podloga ide sa green-900
 * tekstom (6,92 : 1).
 */
export default function Lampica({ broj, hitno = false, className = "" }: { broj: number; hitno?: boolean; className?: string }) {
  if (broj <= 0) return null;
  return (
    <span
      className={`ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold leading-none ${
        hitno ? "bg-kolo-danger text-white" : "bg-kolo-gold-400 text-kolo-green-900"
      } ${className}`}
    >
      {broj}
    </span>
  );
}
