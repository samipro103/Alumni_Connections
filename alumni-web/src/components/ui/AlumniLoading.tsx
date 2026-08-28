import Link from "next/link";

type EmptyStateProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

function Line({
  width = "100%",
  height = 12,
  rounded = false,
}: {
  width?: string;
  height?: number;
  rounded?: boolean;
}) {
  return (
    <span
      className={`alumni-skeleton-block ${
        rounded ? "is-round" : ""
      }`}
      style={{
        width,
        height,
      }}
      aria-hidden="true"
    />
  );
}

function Avatar({
  size = 44,
}: {
  size?: number;
}) {
  return (
    <span
      className="alumni-skeleton-block is-round"
      style={{
        width: size,
        height: size,
        flex: `0 0 ${size}px`,
      }}
      aria-hidden="true"
    />
  );
}

export function AppLoadingSkeleton() {
  return (
    <main
      className="alumni-route-loading"
      role="status"
      aria-label="Cargando Alumni"
    >
      <div className="alumni-route-loading-brand">
        Alumni.
      </div>

      <div className="alumni-route-loading-body">
        <div className="alumni-route-loading-heading">
          <Line width="42%" height={28} />
          <Line width="68%" height={12} />
        </div>

        <ListLoadingSkeleton rows={5} />
      </div>
    </main>
  );
}

export function FeedLoadingSkeleton({
  count = 3,
}: {
  count?: number;
}) {
  return (
    <div
      className="alumni-feed-skeleton"
      role="status"
      aria-label="Cargando publicaciones"
    >
      {Array.from({ length: count }).map(
        (_, index) => (
          <article
            key={index}
            className="alumni-feed-skeleton-post"
          >
            <div className="alumni-feed-skeleton-author">
              <Avatar size={43} />

              <div>
                <Line width="124px" height={12} />
                <Line width="178px" height={9} />
              </div>
            </div>

            <div className="alumni-feed-skeleton-copy">
              <Line width="92%" height={11} />
              <Line width="74%" height={11} />
            </div>

            <div
              className="alumni-skeleton-block alumni-feed-skeleton-media"
              aria-hidden="true"
            />

            <div className="alumni-feed-skeleton-actions">
              <Avatar size={25} />
              <Avatar size={25} />
              <Avatar size={25} />
              <Avatar size={25} />
            </div>
          </article>
        )
      )}
    </div>
  );
}

export function ProfileLoadingSkeleton() {
  return (
    <div
      className="alumni-profile-skeleton"
      role="status"
      aria-label="Cargando perfil"
    >
      <div
        className="alumni-skeleton-block alumni-profile-skeleton-banner"
        aria-hidden="true"
      />

      <section className="alumni-profile-skeleton-main">
        <div className="alumni-profile-skeleton-identity">
          <Avatar size={104} />

          <div className="alumni-profile-skeleton-name">
            <Line width="190px" height={22} />
            <Line width="138px" height={11} />
          </div>
        </div>

        <div className="alumni-profile-skeleton-facts">
          <Line width="120px" height={34} />
          <Line width="120px" height={34} />
          <Line width="120px" height={34} />
        </div>

        <div className="alumni-profile-skeleton-bio">
          <Line width="88%" height={11} />
          <Line width="72%" height={11} />
        </div>
      </section>

      <div className="alumni-profile-skeleton-tabs">
        <Line width="110px" height={12} />
        <Line width="90px" height={12} />
      </div>

      <FeedLoadingSkeleton count={2} />
    </div>
  );
}

export function ListLoadingSkeleton({
  rows = 5,
}: {
  rows?: number;
}) {
  return (
    <div
      className="alumni-list-skeleton"
      role="status"
      aria-label="Cargando contenido"
    >
      {Array.from({ length: rows }).map(
        (_, index) => (
          <div
            key={index}
            className="alumni-list-skeleton-row"
          >
            <Avatar size={48} />

            <div className="alumni-list-skeleton-copy">
              <Line
                width={
                  index % 2 === 0
                    ? "46%"
                    : "58%"
                }
                height={12}
              />
              <Line
                width={
                  index % 3 === 0
                    ? "68%"
                    : "78%"
                }
                height={9}
              />
            </div>

            <Line width="42px" height={10} />
          </div>
        )
      )}
    </div>
  );
}

export function NotificationsLoadingSkeleton() {
  return (
    <div
      className="alumni-notification-skeleton"
      role="status"
      aria-label="Cargando actividad"
    >
      {Array.from({ length: 6 }).map(
        (_, index) => (
          <div
            key={index}
            className="alumni-notification-skeleton-row"
          >
            <Avatar size={46} />

            <div className="alumni-notification-skeleton-copy">
              <Line
                width={
                  index % 2 === 0
                    ? "76%"
                    : "64%"
                }
                height={11}
              />
              <Line width="42%" height={9} />
            </div>

            {index % 3 === 0 ? (
              <span
                className="alumni-skeleton-block alumni-notification-skeleton-preview"
                aria-hidden="true"
              />
            ) : null}
          </div>
        )
      )}
    </div>
  );
}

export function ExploreSearchSkeleton() {
  return (
    <div
      className="alumni-explore-search-skeleton"
      role="status"
      aria-label="Buscando en Alumni"
    >
      <ListLoadingSkeleton rows={4} />

      <div className="alumni-explore-card-skeleton-grid">
        {Array.from({ length: 4 }).map(
          (_, index) => (
            <div
              key={index}
              className="alumni-explore-card-skeleton"
            >
              <div
                className="alumni-skeleton-block alumni-explore-card-skeleton-media"
                aria-hidden="true"
              />
              <Line width="76%" height={11} />
              <Line width="54%" height={9} />
            </div>
          )
        )}
      </div>
    </div>
  );
}

export function ExploreDiscoverySkeleton() {
  return (
    <div
      className="alumni-explore-card-skeleton-grid"
      role="status"
      aria-label="Preparando descubrimientos"
    >
      {Array.from({ length: 4 }).map(
        (_, index) => (
          <div
            key={index}
            className="alumni-explore-card-skeleton"
          >
            <div
              className="alumni-skeleton-block alumni-explore-card-skeleton-media"
              aria-hidden="true"
            />
            <div className="alumni-explore-card-skeleton-meta">
              <Avatar size={30} />
              <div>
                <Line width="104px" height={10} />
                <Line width="72px" height={8} />
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

export function AlumniEmptyState({
  eyebrow = "Alumni.",
  title,
  description,
  actionHref,
  actionLabel,
}: EmptyStateProps) {
  return (
    <section className="alumni-global-empty">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      <p>{description}</p>

      {actionHref && actionLabel ? (
        <Link href={actionHref}>
          {actionLabel}
        </Link>
      ) : null}
    </section>
  );
}

/* ALUMNI_2_7_0_LOADING_COMPONENTS */
