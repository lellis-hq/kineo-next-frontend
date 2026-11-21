import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/atoms/badge";
import { FileTextIcon } from "@/components/atoms/icons";
import { ListingPeriodCell } from "@/components/molecules/listing-table-cells";
import { SpecialtyIcon } from "@/components/molecules/specialty-icon";
import { ApplicationRow } from "@/components/organisms/application-row";
import { type ApplicationEntry, applicationStatus } from "@/lib/applications";
import { formatRelativeTime } from "@/lib/format";

/**
 * The member's applications as the console's table: the posting, its period,
 * and the status that says where it stands. The status is the row's one clear
 * signal — the journey itself lives in the detail view. Each row opens
 * `/applications/[id]`. Below `sm`, `ApplicationsMobileList` takes over.
 */
export function ApplicationsTable({
  applications,
}: {
  applications: readonly ApplicationEntry[];
}) {
  const router = useRouter();

  return (
    <div className="table-flush hidden overflow-x-auto sm:block">
      <table className="table listings-table">
        <thead>
          <tr>
            <th scope="col" className="has-gutter">
              Annonce
            </th>
            <th scope="col">Période</th>
            <th scope="col" className="text-right">
              Statut
            </th>
          </tr>
        </thead>
        <tbody>
          {applications.map((application) => {
            const href = `/applications/${application.id}`;
            const { listing } = application;
            const status = applicationStatus(application);
            const practice = [listing.practiceName, listing.practiceCity]
              .filter(Boolean)
              .join(" · ");

            return (
              <tr
                key={application.id}
                className="row-enter cursor-pointer"
                onClick={(event) => {
                  // The title is a real link: don't navigate twice.
                  if ((event.target as Element).closest("a, button")) return;
                  router.push(href);
                }}
              >
                <td>
                  <div className="flex items-start gap-[var(--cell-gap)]">
                    {listing.specialty ? (
                      <SpecialtyIcon
                        specialty={listing.specialty}
                        className="size-[var(--cell-icon)] shrink-0 text-foreground"
                      />
                    ) : (
                      <FileTextIcon className="size-[var(--cell-icon)] shrink-0 text-muted" />
                    )}
                    <div className="min-w-0">
                      <Link
                        href={href}
                        title={listing.title}
                        className="block max-w-[17rem] truncate leading-[var(--cell-icon)] font-medium text-foreground transition-colors hover:text-primary"
                      >
                        {listing.title}
                      </Link>
                      <p className="max-w-[17rem] truncate text-xs text-muted">
                        {practice || "Cabinet non communiqué"}
                      </p>
                    </div>
                  </div>
                </td>

                <td>
                  {listing.startDate && listing.endDate ? (
                    <ListingPeriodCell
                      dateRange={listing.dateRange}
                      startDate={listing.startDate}
                      endDate={listing.endDate}
                    />
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>

                <td className="text-right whitespace-nowrap">
                  <Badge
                    tone={status.tone}
                    variant="plain"
                    className="font-medium"
                  >
                    {status.label}
                  </Badge>
                  <span className="mt-1 block text-xs text-faint">
                    {formatRelativeTime(application.createdAt)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** The narrow-screen counterpart; the table is removed by CSS. */
export function ApplicationsMobileList({
  applications,
}: {
  applications: readonly ApplicationEntry[];
}) {
  return (
    <ul className="-mx-5 divide-y divide-border border-t border-border sm:hidden">
      {applications.map((application) => (
        <li key={application.id}>
          <ApplicationRow application={application} />
        </li>
      ))}
    </ul>
  );
}
