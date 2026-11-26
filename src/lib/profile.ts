/** The RPPS number's rule; `RPPS_DIGITS` exists for the form's `maxLength`. */
export const RPPS_DIGITS = 11;
/**
 * The rule as a pattern *source*: the input's `pattern` attribute takes the bare
 * `\d{11}` (it anchors itself), the validator the anchored `RegExp`.
 */
export const RPPS_PATTERN_SOURCE = `\\d{${RPPS_DIGITS}}`;
export const RPPS_PATTERN = new RegExp(`^${RPPS_PATTERN_SOURCE}$`);
export const RPPS_ERROR_MESSAGE = `Le numéro RPPS doit contenir exactement ${RPPS_DIGITS} chiffres.`;

/** Mirrors the backend's `city` bound (`textField(100, "City")`). */
export const CITY_MAX_LENGTH = 100;

import { percentOf } from "./format";
import {
  CITY_CODE_REGEX,
  DEPARTMENT_CODE_REGEX,
  POSTAL_CODE_REGEX,
} from "./geo/validation";
import type { ApiProfile, ApiUser, ProfileType, Specialty } from "./types/api";

/** The structured location fields the API now accepts on a profile. */
interface ApiProfileGeo {
  cityCodeInsee?: string | null;
  postalCode?: string | null;
  departmentCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

/**
 * The specialties, with their full name and their name in a fixed-width
 * column. One table, so the two can't drift.
 */
export const SPECIALTY_NAMES: Record<
  Specialty,
  { long: string; short: string }
> = {
  GENERALIST: { long: "Médecine générale", short: "Généraliste" },
  DENTIST: { long: "Chirurgien-dentiste", short: "Dentiste" },
  DERMATOLOGIST: { long: "Dermatologie", short: "Dermatologie" },
  PSYCHIATRIST: { long: "Psychiatrie", short: "Psychiatrie" },
  OTHER: { long: "Autre spécialité", short: "Autre" },
};

export const SPECIALTY_LABELS: Record<Specialty, string> = Object.fromEntries(
  Object.entries(SPECIALTY_NAMES).map(([id, name]) => [id, name.long]),
) as Record<Specialty, string>;

/** The names for a fixed-width chart row. */
export const SPECIALTY_SHORT_LABELS: Record<Specialty, string> =
  Object.fromEntries(
    Object.entries(SPECIALTY_NAMES).map(([id, name]) => [id, name.short]),
  ) as Record<Specialty, string>;

export const PROFILE_TYPE_LABELS: Record<ProfileType, string> = {
  INSTALLED: "Médecin installé",
  REPLACEMENT: "Remplaçant",
  BOTH: "Les deux",
};

export const PROFILE_TYPE_DESCRIPTIONS: Record<ProfileType, string> = {
  INSTALLED: "Vous publiez des annonces pour trouver un remplaçant.",
  REPLACEMENT: "Vous cherchez des remplacements à pourvoir.",
  BOTH: "Vous publiez des annonces et candidatez aux remplacements.",
};

/** One step towards a complete profile, as the checklist shows it. */
export interface CompletenessItem {
  id: string;
  label: string;
  /** How the item reads in « Il manque … ». */
  missing: string;
  done: boolean;
}

/**
 * How much of what practices look at the member has filled in: the account,
 * the professional details, and the two verifications. Each item weighs the
 * same; the order is the checklist's, easiest first.
 */
export function profileCompleteness(
  user: Pick<ApiUser, "name" | "image" | "emailVerified">,
  profile: Pick<ApiProfile, "rppsNumber" | "city" | "verified">,
): { percent: number; done: number; items: CompletenessItem[] } {
  const items: CompletenessItem[] = [
    {
      id: "name",
      label: "Nom complet",
      missing: "votre nom",
      done: Boolean(user.name?.trim()),
    },
    {
      id: "email",
      label: "Adresse e-mail vérifiée",
      missing: "la vérification de votre e-mail",
      done: user.emailVerified,
    },
    {
      id: "city",
      label: "Ville principale",
      missing: "votre ville",
      done: Boolean(profile.city),
    },
    {
      id: "rpps",
      label: "Numéro RPPS",
      missing: "votre numéro RPPS",
      done: Boolean(profile.rppsNumber),
    },
    {
      id: "image",
      label: "Photo de profil",
      missing: "votre photo",
      done: Boolean(user.image),
    },
    {
      id: "verified",
      label: "Identité vérifiée",
      missing: "la vérification de votre identité",
      done: profile.verified,
    },
  ];

  const done = items.filter((item) => item.done).length;
  return { percent: percentOf(done, items.length), done, items };
}

/**
 * The completeness as one sentence — « Il manque votre photo et votre ville. »
 * — or null once nothing is missing.
 */
export function completenessSentence(
  items: readonly CompletenessItem[],
): string | null {
  const missing = items
    .filter((item) => !item.done)
    .map((item) => item.missing);
  if (missing.length === 0) return null;
  const last = missing.pop();
  const list = missing.length > 0 ? `${missing.join(", ")} et ${last}` : last;
  return `Il manque ${list}.`;
}

/** "Membre depuis {month year}" — fr-FR locale. */
export function formatMemberSince(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

/** Valid, normalized profile payload sent to the API. */
export interface ProfileFormData {
  specialty: Specialty;
  profileType: ProfileType;
  rppsNumber?: string;
  city?: string;
  cityCodeInsee?: string;
  departmentCode?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  isPublic: boolean;
}

/** Raw form state — select values may still be empty before user input. */
export interface ProfileFormValues {
  specialty: Specialty | "";
  profileType: ProfileType | "";
  rppsNumber: string;
  city: string;
  cityCodeInsee: string;
  departmentCode: string;
  postalCode: string;
  latitude: string;
  longitude: string;
  isPublic: boolean;
}

export const EMPTY_PROFILE_FORM: ProfileFormValues = {
  specialty: "",
  profileType: "",
  rppsNumber: "",
  city: "",
  cityCodeInsee: "",
  departmentCode: "",
  postalCode: "",
  latitude: "",
  longitude: "",
  isPublic: true,
};

export function profileToFormValues(profile: ApiProfile): ProfileFormValues {
  const geo = profile as ApiProfileGeo;
  return {
    specialty: profile.specialty,
    profileType: profile.profileType,
    rppsNumber: profile.rppsNumber ?? "",
    city: profile.city ?? "",
    cityCodeInsee: geo.cityCodeInsee ?? "",
    departmentCode: geo.departmentCode ?? "",
    postalCode: geo.postalCode ?? "",
    latitude:
      geo.latitude !== null && geo.latitude !== undefined
        ? String(geo.latitude)
        : "",
    longitude:
      geo.longitude !== null && geo.longitude !== undefined
        ? String(geo.longitude)
        : "",
    isPublic: profile.isPublic ?? true,
  };
}

export interface ProfileFormResult {
  payload?: ProfileFormData;
  error?: string;
}

/** Validates raw form values; returns the normalized payload or a French error message. */
export function validateProfileForm(
  values: ProfileFormValues,
): ProfileFormResult {
  if (!values.specialty) {
    return { error: "Sélectionnez votre spécialité." };
  }
  if (!values.profileType) {
    return { error: "Sélectionnez votre type de pratique." };
  }

  const rpps = values.rppsNumber.trim();
  if (rpps && !RPPS_PATTERN.test(rpps)) {
    return { error: RPPS_ERROR_MESSAGE };
  }

  const city = values.city.trim();
  if (city.length > CITY_MAX_LENGTH) {
    return {
      error: `Le nom de la ville ne peut pas dépasser ${CITY_MAX_LENGTH} caractères.`,
    };
  }

  const cityCodeInsee = values.cityCodeInsee.trim().toUpperCase();
  if (cityCodeInsee && !CITY_CODE_REGEX.test(cityCodeInsee)) {
    return { error: "Code commune invalide." };
  }
  const departmentCode = values.departmentCode.trim().toUpperCase();
  if (departmentCode && !DEPARTMENT_CODE_REGEX.test(departmentCode)) {
    return { error: "Code département invalide." };
  }
  const postalCode = values.postalCode.trim();
  if (postalCode && !POSTAL_CODE_REGEX.test(postalCode)) {
    return { error: "Le code postal doit contenir 5 chiffres." };
  }
  const lat = values.latitude.trim();
  const lng = values.longitude.trim();
  if (Boolean(lat) !== Boolean(lng)) {
    return {
      error: "La latitude et la longitude doivent être renseignées ensemble.",
    };
  }
  const latitude = lat ? Number(lat) : undefined;
  const longitude = lng ? Number(lng) : undefined;
  if (
    latitude !== undefined &&
    (!Number.isFinite(latitude) ||
      Math.abs(latitude) > 90 ||
      longitude === undefined ||
      !Number.isFinite(longitude) ||
      Math.abs(longitude) > 180)
  ) {
    return { error: "Coordonnées invalides." };
  }

  return {
    payload: {
      specialty: values.specialty,
      profileType: values.profileType,
      rppsNumber: rpps || undefined,
      city: city || undefined,
      cityCodeInsee: cityCodeInsee || undefined,
      departmentCode: departmentCode || undefined,
      postalCode: postalCode || undefined,
      latitude,
      longitude,
      isPublic: values.isPublic,
    },
  };
}
