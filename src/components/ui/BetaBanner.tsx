export function BetaBanner() {
  const feedbackUrl = `mailto:hei@hulltetteren.no?subject=${encodeURIComponent('Tilbakemelding på Hulltetteren')}`;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <span className="font-medium">Beta</span>
        <span className="text-amber-600" aria-hidden="true">·</span>
        <span>Appen er under utvikling</span>
        <span className="text-amber-600" aria-hidden="true">·</span>
        <a
          href={feedbackUrl}
          className="text-amber-700 hover:text-amber-900 underline font-medium inline-flex items-center min-h-[44px] px-2"
        >
          Gi tilbakemelding
        </a>
      </div>
    </div>
  );
}
