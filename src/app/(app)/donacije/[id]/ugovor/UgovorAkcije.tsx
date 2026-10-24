"use client";

export default function UgovorAkcije({ labela }: { labela: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="text-sm font-medium px-3 py-1.5 rounded-lg bg-kolo-green-100 text-kolo-green-700 hover:bg-kolo-green-200"
    >
      {labela}
    </button>
  );
}
