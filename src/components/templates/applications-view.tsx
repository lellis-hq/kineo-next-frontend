import { EmptyState } from "@/components/molecules/empty-state";
import { Pagination } from "@/components/molecules/pagination";
import { Panel } from "@/components/molecules/panel";
import { SegmentedControl } from "@/components/molecules/segmented-control";
import {
  ApplicationsMobileList,
  ApplicationsTable,
} from "@/components/organisms/applications-table";
import {
  APPLICATION_FILTERS,
  type ApplicationsData,
  type ApplicationsFilter,
  awaitingDecisionCount,
  countForBucket,
  countForSituation,
  REJECTION_SITUATIONS,
  type RejectionSituationFilter,
} from "@/lib/applications";
import { SITE_SHELL } from "@/lib/layout";
import {
  APPLICATIONS_PAGE_SIZE_CHOICES,
  type ApplicationsPageSize,
} from "@/lib/page-size";

interface ApplicationsViewProps {
  data: ApplicationsData;
  onPageChange: (page: number) => void;
  onPrefetchPage?: (page: number) => void;
  onFilterChange: (filter: ApplicationsFilter) => void;
  currentFilter: ApplicationsFilter;
  currentSituation: RejectionSituationFilter;
  onSituationChange: (situation: RejectionSituationFilter) => void;
  pageSize: ApplicationsPageSize;
  onPageSizeChange: (size: ApplicationsPageSize) => void;
  loading: boolean;
}

/**
 * /applications: the filter bar owns "what am I looking at", the panel owns
 * "what did I find". One status per row, no second slicing of the same list.
 */
export function ApplicationsView({
  data,
  onPageChange,
  onPrefetchPage,
  onFilterChange,
  currentFilter,
  currentSituation,
  onSituationChange,
  pageSize,
  onPageSizeChange,
  loading,
}: ApplicationsViewProps) {
  const hasAny = data.counts.total > 0;
  const awaiting = awaitingDecisionCount(data.counts);

  return (
    <div className={`${SITE_SHELL} py-4 lg:py-6`}>
      {hasAny && (
        <div className="mb-4 flex flex-col gap-3">
          <SegmentedControl
            className="w-fit"
            ariaLabel="Filtrer les candidatures par statut"
            options={APPLICATION_FILTERS.map((option) => ({
              ...option,
              count: countForBucket(option, data),
            }))}
            value={currentFilter}
            onChange={onFilterChange}
          />

          {/* Only under « Refusées », and only when some situation is non-empty. */}
          {currentFilter === "REFUSED" && hasSituation(data) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="text-xs font-medium text-muted">
                Précisez le motif
              </span>
              <SegmentedControl
                className="w-fit"
                ariaLabel="Filtrer les candidatures refusées par situation"
                options={REJECTION_SITUATIONS.map((option) => ({
                  ...option,
                  count: countForSituation(option.id, data),
                }))}
                value={currentSituation}
                onChange={onSituationChange}
              />
            </div>
          )}
        </div>
      )}

      <Panel
        title={
          <>
            Mes candidatures{" "}
            <span className="text-muted tabular-nums">{data.counts.total}</span>
          </>
        }
      >
        {!hasAny ? (
          <EmptyState
            fill
            title="Aucune candidature pour l'instant"
            description="Parcourez les annonces ouvertes et candidatez en un clic avec un message personnalisé."
            actionLabel="Parcourir les annonces"
            actionHref="/listings"
          />
        ) : (
          <>
            <p className="mb-4 text-sm text-muted">
              {awaiting > 0 ? (
                <>
                  <span className="text-foreground tabular-nums">
                    {awaiting}
                  </span>{" "}
                  attend{awaiting > 1 ? "ent" : ""} encore une réponse d&apos;un
                  cabinet.
                </>
              ) : (
                "Aucune candidature n'attend de réponse."
              )}
            </p>

            {data.applications.length === 0 ? (
              <EmptyState
                fill
                title="Aucune candidature dans ce statut"
                description="Changez de filtre pour voir vos autres candidatures."
              />
            ) : (
              <>
                <ApplicationsTable applications={data.applications} />
                <ApplicationsMobileList applications={data.applications} />
              </>
            )}

            <Pagination
              currentPage={data.pagination.page}
              totalPages={data.pagination.totalPages}
              onPageChange={onPageChange}
              onPrefetch={onPrefetchPage}
              pageSize={pageSize}
              onPageSizeChange={onPageSizeChange}
              choices={APPLICATIONS_PAGE_SIZE_CHOICES}
              loading={loading}
              className="mt-3 lg:mt-4"
            />
          </>
        )}
      </Panel>
    </div>
  );
}

/**
 * Whether any situation has rows. « Toutes » is excluded: an erasure settles a
 * rejection without putting it in any of the three.
 */
function hasSituation(data: ApplicationsData): boolean {
  return REJECTION_SITUATIONS.some(
    (option) => option.id !== "ALL" && countForSituation(option.id, data) > 0,
  );
}
