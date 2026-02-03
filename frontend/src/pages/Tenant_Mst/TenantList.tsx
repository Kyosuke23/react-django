import { useEffect, useMemo, useState } from "react";
import type { Tenant } from "../../lib/tenants";
import { listTenants, deleteTenant, restoreTenant } from "../../lib/tenants";

export default function TenantList() {
  const [q, setQ] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [rows, setRows] = useState<Tenant[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  async function reload() {
    const data = await listTenants({ q, include_deleted: includeDeleted });
    setRows(data);
    if (selectedId && !data.some(r => r.id === selectedId)) setSelectedId(null);
  }

  useEffect(() => { reload(); }, [q, includeDeleted]);

  const selected = useMemo(() => rows.find(r => r.id === selectedId) ?? null, [rows, selectedId]);

  return (
    <div className="h-full flex gap-3">
      {/* Main table area */}
      <div className="flex-1 rounded-xl border border-white/10 bg-[#0b1220]">
        <div className="flex items-center gap-3 p-3 border-b border-white/10">
          <div className="flex-1">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search (name / email / tel)"
              className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm text-white outline-none"
            />
          </div>

          <label className="text-xs text-white/70 flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => setIncludeDeleted(e.target.checked)}
            />
            show deleted
          </label>

          <button
            className="rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 px-3 py-2 text-sm text-white"
            onClick={() => alert("ここで追加モーダルを開く")}
          >
            + New
          </button>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm text-white/85">
            <thead className="sticky top-0 bg-[#0b1220]">
              <tr className="text-xs text-white/55 border-b border-white/10">
                <th className="text-left p-3">Tenant</th>
                <th className="text-left p-3">Representative</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Tel</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => {
                const active = r.id === selectedId;
                return (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className={[
                      "border-b border-white/5 cursor-pointer",
                      active ? "bg-white/10" : "hover:bg-white/5",
                      r.is_deleted ? "opacity-60" : "",
                    ].join(" ")}
                  >
                    <td className="p-3">
                      <div className="font-medium">{r.tenant_name}</div>
                      <div className="text-xs text-white/50">{r.tenant_code}</div>
                    </td>
                    <td className="p-3">{r.representative_name}</td>
                    <td className="p-3">{r.email}</td>
                    <td className="p-3">{r.tel_number ?? "-"}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          className="px-2 py-1 rounded bg-white/10 hover:bg-white/15 border border-white/10"
                          onClick={(e) => { e.stopPropagation(); alert("編集モーダル"); }}
                        >
                          Edit
                        </button>

                        {!r.is_deleted ? (
                          <button
                            className="px-2 py-1 rounded bg-red-500/15 hover:bg-red-500/25 border border-red-500/30"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!confirm(`Delete "${r.tenant_name}" ? (soft delete)`)) return;
                              await deleteTenant(r.id);
                              await reload();
                            }}
                          >
                            Delete
                          </button>
                        ) : (
                          <button
                            className="px-2 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await restoreTenant(r.id);
                              await reload();
                            }}
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {rows.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-white/50" colSpan={5}>
                    No results
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right detail panel (Docker Desktopっぽい) */}
      <div className="w-[420px] rounded-xl border border-white/10 bg-[#0b1220] p-3">
        {!selected ? (
          <div className="text-white/50 text-sm p-2">Select a tenant to view details.</div>
        ) : (
          <div className="space-y-3">
            <div>
              <div className="text-xs text-white/50">Tenant</div>
              <div className="text-lg text-white font-semibold">{selected.tenant_name}</div>
              <div className="text-xs text-white/50">{selected.tenant_code}</div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <Field label="Representative" value={selected.representative_name} />
              <Field label="Email" value={selected.email} />
              <Field label="Tel" value={selected.tel_number ?? "-"} />
              <Field label="Postal" value={selected.postal_code ?? "-"} />
              <Field label="State" value={selected.state ?? "-"} />
              <Field label="City" value={selected.city ?? "-"} />
              <Field label="Address" value={selected.address ?? "-"} />
              <Field label="Address2" value={selected.address2 ?? "-"} />
            </div>

            <div className="pt-2 border-t border-white/10 text-xs text-white/50">
              created: {selected.created_at}<br/>
              updated: {selected.updated_at}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-2">
      <div className="text-xs text-white/50">{label}</div>
      <div className="text-white/85 break-words">{value}</div>
    </div>
  );
}