import Link from "next/link";
import { Badge } from "@/components/atoms/badge";
import { ArrowRightIcon } from "@/components/atoms/icons";
import { ProgressTrack } from "@/components/molecules/progress-track";
import {
  type ApplicationEntry,
  applicationProgress,
  applicationStatus,
  practiceLabel,
} from "@/lib/applications";

/**
 * One application as a row on narrow screens: what it is, where it stands,
 * then the journey with its labels. The whole card is the link.
 */
export function ApplicationRow({
  application,
}: {
  application: ApplicationEntry;
}) {
  const practice = practiceLabel(application.listing);
  const { dateRange } = application.listing;
  const status = applicationStatus(application);

  return (
    <Link
      href={`/applications/${application.id}`}
      className="group grid gap-y-4 px-5 py-5 transition-colors hover:bg-surface-hover focus-visible:outline-offset-[-2px] sm:px-6"
    >
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-medium text-foreground">
            {application.listing.title}
          </p>
          {practice && (
            <p className="mt-0.5 truncate text-sm text-muted">{practice}</p>
          )}
          <p className="mt-1.5 truncate text-xs text-faint">
            {[dateRange, application.submittedLabel]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>

        <span className="flex shrink-0 items-center gap-2">
          <Badge tone={status.tone} variant="plain" className="font-medium">
            {status.label}
          </Badge>
          <ArrowRightIcon
            aria-hidden="true"
            className="size-4 shrink-0 text-faint transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary"
          />
        </span>
      </div>

      <ProgressTrack steps={applicationProgress(application)} />
    </Link>
  );
}
