"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeName } from "./picker-utils";

interface CreateFormProps {
  initialName: string;
  singular: string;
  takenNames: string[];
  saving: boolean;
  onCancel: () => void;
  onSubmit: (name: string) => void;
}

export function CreateForm({ initialName, singular, takenNames, saving, onCancel, onSubmit }: CreateFormProps) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);

  const taken = new Set(takenNames.map((item) => normalizeName(item)));

  const save = () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError(`Name must be at least 2 characters.`);
      return;
    }
    if (taken.has(normalizeName(trimmed))) {
      setError(`This ${singular.toLowerCase()} already exists.`);
      return;
    }
    setError(null);
    onSubmit(trimmed);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {singular} name
        </label>
        <Input
          autoFocus
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              save();
            }
          }}
          placeholder={`Enter ${singular.toLowerCase()} name`}
        />
        {error ? (
          <p className="text-xs font-medium text-red-500">{error}</p>
        ) : (
          <p className="text-xs text-gray-400">It will be available in every form right away.</p>
        )}
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="button" onClick={save} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save
        </Button>
      </div>
    </div>
  );
}
