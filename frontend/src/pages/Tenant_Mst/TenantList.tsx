import { useEffect, useState } from "react";
import type { Tenant } from "../../lib/tenants";
import { listTenants } from "../../lib/tenants";
import { Pencil, Trash2 } from "lucide-react";

export default function TenantList() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selected, setSelected] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reload();
  }, []);

  async function reload() {
    setLoading(true);
    try {
      const data = await listTenants();
      setTenants(data);
      if (data.length && !selected) setSelected(data[0]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full gap-4">
      {/* ===== 左：一覧 ===== */}
      <div className="flex-1 min-w-0 rounded-xl border border-white/10 bg-white/5">
        <div className="border-b border-white/10 px-4 py-2 text-sm text-white/70">
          テナント一覧
        </div>

        <div className="h-[calc(100%-41px)] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#0b1220] text-white/60">
              <tr>
                <th className="px-3 py-2 text-left">Tenant</th>
                <th className="px-3 py-2 text-left">Representative</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Tel</th>
                <th className="px-3 py-2 text-center w-24">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-white/40">
                    Loading...
                  </td>
                </tr>
              )}

              {!loading &&
                tenants.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className={`cursor-pointer border-b border-white/5
                      hover:bg-white/5
                      ${selected?.id === t.id ? "bg-white/10" : ""}`}
                  >
                    <td className="px-3 py-2 truncate">{t.tenant_name}</td>
                    <td className="px-3 py-2 truncate">
                      {t.representative_name}
                    </td>
                    <td className="px-3 py-2 truncate">{t.email}</td>
                    <td className="px-3 py-2 truncate">{t.tel_number}</td>

                    <td className="px-3 py-1">
                      <div className="flex justify-center gap-1">
                        <button
                          className="rounded-md p-1.5 hover:bg-blue-500/20"
                          title="Edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log("edit", t.id);
                          }}
                        >
                          <Pencil size={16} className="text-blue-400" />
                        </button>

                        <button
                          className="rounded-md p-1.5 hover:bg-red-500/20"
                          title="Delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log("delete", t.id);
                          }}
                        >
                          <Trash2 size={16} className="text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== 右：詳細 ===== */}
      <div className="w-[360px] shrink-0 rounded-xl border border-white/10 bg-white/5 p-4">
        {!selected ? (
          <div className="text-white/40">Select a tenant</div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="text-xs text-white/50">Tenant</div>
              <div className="font-semibold">{selected.tenant_name}</div>
              <div className="text-xs text-white/40">{selected.tenant_code}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Detail label="Representative" value={selected.representative_name} />
              <Detail label="Tel" value={selected.tel_number} />
              <Detail label="Postal" value={selected.postal_code} />
              <Detail label="State" value={selected.state} />
              <Detail label="City" value={selected.city} />
              <Detail label="Address" value={selected.address} />
            </div>

            {/* Email は横いっぱい */}
            <Detail label="Email" value={selected.email} wide />

            <div className="pt-2 text-xs text-white/40">
              created: {selected.created_at}
              <br />
              updated: {selected.updated_at}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  wide,
}: {
  label: string;
  value?: string | null;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <div className="text-xs text-white/50">{label}</div>
      <div className="truncate">{value || "-"}</div>
    </div>
  );
}