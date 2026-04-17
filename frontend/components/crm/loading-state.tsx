export function WorkspaceLoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="surface-card h-[162px] p-6">
            <div className="skeleton-bar h-4 w-28" />
            <div className="skeleton-bar mt-6 h-10 w-24" />
            <div className="skeleton-bar mt-10 h-3 w-32" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="surface-card min-h-[380px] p-6">
          <div className="skeleton-bar h-4 w-36" />
          <div className="skeleton-bar mt-4 h-3 w-52" />
          <div className="mt-10 grid h-[240px] grid-cols-8 items-end gap-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="skeleton-bar rounded-[22px]"
                style={{ height: `${120 + (index % 4) * 24}px` }}
              />
            ))}
          </div>
        </div>

        <div className="surface-card min-h-[380px] p-6">
          <div className="skeleton-bar h-4 w-28" />
          <div className="skeleton-bar mt-4 h-3 w-44" />
          <div className="mt-8 space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="surface-card rounded-[22px] p-4 shadow-none">
                <div className="skeleton-bar h-4 w-32" />
                <div className="skeleton-bar mt-3 h-3 w-44" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="surface-card overflow-hidden p-6">
        <div className="skeleton-bar h-4 w-28" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="grid gap-3 border-b border-[var(--border-color)] pb-4 last:border-none last:pb-0 md:grid-cols-6"
            >
              {Array.from({ length: 6 }).map((__, cellIndex) => (
                <div key={cellIndex} className="skeleton-bar h-4 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
