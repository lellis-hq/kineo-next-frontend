"use client";

import Form from "next/form";
import { useState } from "react";
import { InlineAlert } from "@/components/molecules/inline-alert";
import { PlaceAutocomplete } from "@/components/molecules/place-autocomplete";
import { Select } from "@/components/molecules/select";
import { SubmitButton } from "@/components/molecules/submit-button";
import type { SelectedPlace } from "@/lib/geo/types";
import {
  PROFILE_TYPE_LABELS,
  type ProfileFormData,
  type ProfileFormValues,
  RPPS_DIGITS,
  RPPS_PATTERN_SOURCE,
  SPECIALTY_LABELS,
  validateProfileForm,
} from "@/lib/profile";

/** Create/edit profile form, with uncontrolled fields. */
export function ProfileForm({
  initialValues,
  submitLabel,
  pendingLabel,
  onSubmit,
}: {
  initialValues: ProfileFormValues;
  submitLabel: string;
  pendingLabel: string;
  /** Sends the payload to the API; returns an error message, or undefined on success. */
  onSubmit: (payload: ProfileFormData) => Promise<string | undefined>;
}) {
  const [error, setError] = useState("");
  const [cityValue, setCityValue] = useState(initialValues.city);
  const [place, setPlace] = useState<SelectedPlace | null>(null);

  async function handleSubmit(formData: FormData) {
    setError("");

    const values: ProfileFormValues = {
      specialty: String(
        formData.get("specialty") ?? "",
      ) as ProfileFormValues["specialty"],
      profileType: String(
        formData.get("profileType") ?? "",
      ) as ProfileFormValues["profileType"],
      rppsNumber: String(formData.get("rppsNumber") ?? "").trim(),
      city: String(formData.get("city") ?? "").trim(),
      cityCodeInsee: String(formData.get("cityCodeInsee") ?? "").trim(),
      departmentCode: String(formData.get("departmentCode") ?? "").trim(),
      postalCode: String(formData.get("postalCode") ?? "").trim(),
      latitude: String(formData.get("latitude") ?? "").trim(),
      longitude: String(formData.get("longitude") ?? "").trim(),
      isPublic: formData.get("isPublic") === "on",
    };

    const result = validateProfileForm(values);
    if (result.error || !result.payload) {
      setError(result.error ?? "Formulaire invalide.");
      return;
    }

    const apiError = await onSubmit(result.payload);
    if (apiError) {
      setError(apiError);
    }
  }

  return (
    <Form action={handleSubmit} className="flex flex-col gap-6 sm:gap-8">
      <div className="flex min-w-0 flex-col gap-3">
        <span className="field-label">Spécialité</span>
        <Select
          id="specialty"
          name="specialty"
          required
          defaultValue={initialValues.specialty}
        >
          <option value="" disabled>
            Sélectionner une spécialité
          </option>
          {Object.entries(SPECIALTY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <span className="field-label">Type de pratique</span>
        <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
          {Object.entries(PROFILE_TYPE_LABELS).map(([value, label]) => (
            <label
              key={value}
              className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-control border border-border bg-surface-2 px-4 py-3 text-center text-sm text-muted hover:bg-surface-3 has-checked:border-primary has-checked:bg-primary/10 has-checked:font-medium has-checked:text-primary"
            >
              <input
                type="radio"
                name="profileType"
                value={value}
                defaultChecked={initialValues.profileType === value}
                className="sr-only"
                required
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
        <label className="flex min-w-0 flex-col gap-3">
          <span className="flex items-center justify-between gap-2">
            <span className="field-label">Numéro RPPS</span>
            <span className="shrink-0 text-xs text-muted">
              {RPPS_DIGITS} chiffres
            </span>
          </span>
          <input
            name="rppsNumber"
            type="text"
            inputMode="numeric"
            pattern={RPPS_PATTERN_SOURCE}
            maxLength={RPPS_DIGITS}
            placeholder="12345678901"
            defaultValue={initialValues.rppsNumber}
            className="field-input"
          />
        </label>

        <label className="flex min-w-0 flex-col gap-3">
          <span className="flex items-center justify-between gap-2">
            <span className="field-label">Ville principale</span>
            <span className="shrink-0 text-xs text-muted">Optionnel</span>
          </span>
          <PlaceAutocomplete
            id="profile-city"
            label="Ville principale"
            placeholder="Ville ou département"
            value={initialValues.city}
            onCommit={(selected, text) => {
              setCityValue(text);
              setPlace(selected);
            }}
          />
          <input type="hidden" name="city" value={cityValue} />
          <input
            type="hidden"
            name="cityCodeInsee"
            value={place?.cityCodeInsee ?? ""}
          />
          <input
            type="hidden"
            name="departmentCode"
            value={place?.departmentCode ?? ""}
          />
          <input
            type="hidden"
            name="postalCode"
            value={place?.postalCode ?? ""}
          />
          <input type="hidden" name="latitude" value={place?.latitude ?? ""} />
          <input
            type="hidden"
            name="longitude"
            value={place?.longitude ?? ""}
          />
        </label>
      </div>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="isPublic"
          defaultChecked={initialValues.isPublic}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary"
        />
        <span className="text-foreground/85">
          Rendre mon profil visible dans l&rsquo;annuaire public
        </span>
      </label>

      {error && (
        // whitespace-pre-wrap: Zod field errors are joined with newlines.
        <InlineAlert as="p" tone="danger" className="whitespace-pre-wrap">
          {error}
        </InlineAlert>
      )}

      <SubmitButton label={submitLabel} pendingLabel={pendingLabel} />
    </Form>
  );
}
