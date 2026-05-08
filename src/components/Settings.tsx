import { useState } from "react";
import { X, Plus, Trash2, FolderPlus } from "lucide-react";
import type { Config, PackageGroup } from "../types";
import { generateId } from "../types";

interface Props {
  config: Config;
  onSave: (config: Config) => Promise<void>;
  onClose: () => void;
}

interface AddPackageRowProps {
  existingPackages: string[];
  onAdd: (pkg: string) => void;
}

function AddPackageRow({ existingPackages, onAdd }: AddPackageRowProps) {
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || existingPackages.includes(trimmed)) return;
    onAdd(trimmed);
    setValue("");
  };

  return (
    <div className="flex gap-1.5 mt-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="@sinequa/xxx"
        className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
      />
      <button
        onClick={submit}
        disabled={!value.trim()}
        className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-40 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function Settings({ config, onSave, onClose }: Props) {
  const [local, setLocal] = useState<Config>({
    ...config,
    groups: config.groups.map((g) => ({ ...g, packages: [...g.packages] })),
  });
  const [saving, setSaving] = useState(false);

  const allExisting = local.groups.flatMap((g) => g.packages);

  const updateGroupName = (idx: number, name: string) => {
    setLocal((prev) => {
      const groups = [...prev.groups];
      groups[idx] = { ...groups[idx], name };
      return { ...prev, groups };
    });
  };

  const removeGroup = (idx: number) => {
    setLocal((prev) => ({
      ...prev,
      groups: prev.groups.filter((_, i) => i !== idx),
    }));
  };

  const addGroup = () => {
    setLocal((prev) => ({
      ...prev,
      groups: [
        ...prev.groups,
        { id: generateId(), name: "Nouveau groupe", packages: [] },
      ],
    }));
  };

  const addPackageToGroup = (groupIdx: number, pkg: string) => {
    setLocal((prev) => {
      const groups = [...prev.groups];
      groups[groupIdx] = {
        ...groups[groupIdx],
        packages: [...groups[groupIdx].packages, pkg],
      };
      return { ...prev, groups };
    });
  };

  const removePackageFromGroup = (groupIdx: number, pkg: string) => {
    setLocal((prev) => {
      const groups = [...prev.groups];
      groups[groupIdx] = {
        ...groups[groupIdx],
        packages: groups[groupIdx].packages.filter((p) => p !== pkg),
      };
      return { ...prev, groups };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(local);
    setSaving(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-semibold text-gray-800">Paramètres</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-6 py-4 space-y-5 flex-1">
          {/* Verdaccio URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL Verdaccio
            </label>
            <input
              type="url"
              value={local.verdaccioUrl}
              onChange={(e) =>
                setLocal((prev) => ({ ...prev, verdaccioUrl: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Refresh interval */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Intervalle de rafraîchissement
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={60}
                step={60}
                value={local.refreshInterval}
                onChange={(e) =>
                  setLocal((prev) => ({
                    ...prev,
                    refreshInterval: Number(e.target.value),
                  }))
                }
                className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-500">
                secondes ({Math.round(local.refreshInterval / 60)} min)
              </span>
            </div>
          </div>

          {/* Groups */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Groupes de packages
            </label>

            <div className="space-y-3">
              {local.groups.map((group: PackageGroup, groupIdx: number) => (
                <div
                  key={group.id}
                  className="border border-gray-200 rounded-xl p-3"
                >
                  {/* Group header */}
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      value={group.name}
                      onChange={(e) => updateGroupName(groupIdx, e.target.value)}
                      className="flex-1 text-sm font-semibold px-2 py-1 rounded border border-transparent hover:border-gray-200 focus:border-blue-400 focus:outline-none bg-transparent"
                      placeholder="Nom du groupe"
                    />
                    <button
                      onClick={() => removeGroup(groupIdx)}
                      className="text-gray-300 hover:text-red-400 transition-colors shrink-0"
                      title="Supprimer ce groupe"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Packages */}
                  <div className="space-y-1">
                    {group.packages.length === 0 && (
                      <p className="text-xs text-gray-400 italic px-1">
                        Aucun package dans ce groupe
                      </p>
                    )}
                    {group.packages.map((pkg) => (
                      <div
                        key={pkg}
                        className="flex items-center justify-between px-2 py-1 bg-gray-50 rounded-lg"
                      >
                        <span className="font-mono text-xs text-gray-700">
                          {pkg}
                        </span>
                        <button
                          onClick={() => removePackageFromGroup(groupIdx, pkg)}
                          className="text-gray-300 hover:text-red-400 transition-colors ml-2 shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <AddPackageRow
                    existingPackages={allExisting}
                    onAdd={(pkg) => addPackageToGroup(groupIdx, pkg)}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={addGroup}
              className="mt-3 w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              Nouveau groupe
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
