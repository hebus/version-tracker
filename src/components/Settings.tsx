import { useState } from "react";
import { X, Plus, Trash2, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      <Input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="@sinequa/xxx"
        aria-label="Nom du package à ajouter"
        className="flex-1 h-7 text-xs font-mono"
      />
      <Button
        size="icon-sm"
        onClick={submit}
        disabled={!value.trim()}
        aria-label="Ajouter le package"
      >
        <Plus />
      </Button>
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
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-lg max-h-[90vh] flex flex-col gap-0 p-0"
      >
        <DialogHeader className="flex-row items-center justify-between px-6 py-4 border-b shrink-0">
          <DialogTitle className="text-lg font-semibold">Paramètres</DialogTitle>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Fermer"
            className="text-muted-foreground"
          >
            <X />
          </Button>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-6 py-4 space-y-5 flex-1">
          {/* Verdaccio URL */}
          <div className="space-y-1.5">
            <Label htmlFor="verdaccio-url">URL Verdaccio</Label>
            <Input
              id="verdaccio-url"
              type="url"
              value={local.verdaccioUrl}
              onChange={(e) =>
                setLocal((prev) => ({ ...prev, verdaccioUrl: e.target.value }))
              }
              className="h-9"
            />
          </div>

          {/* Refresh interval */}
          <div className="space-y-1.5">
            <Label htmlFor="refresh-interval">Intervalle de rafraîchissement</Label>
            <div className="flex items-center gap-2">
              <Input
                id="refresh-interval"
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
                className="w-28 h-9"
              />
              <span className="text-sm text-muted-foreground">
                secondes ({Math.round(local.refreshInterval / 60)} min)
              </span>
            </div>
          </div>

          {/* Groups */}
          <div>
            <Label className="mb-3">Groupes de packages</Label>

            <div className="space-y-3">
              {local.groups.map((group: PackageGroup, groupIdx: number) => (
                <div key={group.id} className="border rounded-xl p-3">
                  {/* Group header */}
                  <div className="flex items-center gap-2 mb-2">
                    <Input
                      value={group.name}
                      onChange={(e) => updateGroupName(groupIdx, e.target.value)}
                      aria-label="Nom du groupe"
                      className="flex-1 h-7 text-sm font-semibold border-transparent bg-transparent shadow-none hover:border-input dark:bg-transparent"
                      placeholder="Nom du groupe"
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeGroup(groupIdx)}
                      title="Supprimer ce groupe"
                      aria-label="Supprimer ce groupe"
                      className="text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 />
                    </Button>
                  </div>

                  {/* Packages */}
                  <div className="space-y-1">
                    {group.packages.length === 0 && (
                      <p className="text-xs text-muted-foreground italic px-1">
                        Aucun package dans ce groupe
                      </p>
                    )}
                    {group.packages.map((pkg) => (
                      <div
                        key={pkg}
                        className="flex items-center justify-between pl-2 pr-1 py-0.5 bg-muted/60 rounded-lg"
                      >
                        <span className="font-mono text-xs">{pkg}</span>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => removePackageFromGroup(groupIdx, pkg)}
                          aria-label={`Retirer ${pkg}`}
                          className="text-muted-foreground hover:text-destructive ml-2 shrink-0"
                        >
                          <X />
                        </Button>
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

            <Button
              variant="outline"
              onClick={addGroup}
              className="mt-3 w-full h-10 border-2 border-dashed text-muted-foreground"
            >
              <FolderPlus />
              Nouveau groupe
            </Button>
          </div>
        </div>

        <DialogFooter className="mx-0 mb-0 px-6 py-4 shrink-0">
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
