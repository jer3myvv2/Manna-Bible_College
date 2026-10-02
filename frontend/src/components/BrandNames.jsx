/**
 * "Manna College | Manna Bible Institute" shown side by side with a vertical
 * gold divider, as on the posters.
 */
export default function BrandNames({ className = '' }) {
  return (
    <span className={`brand-names ${className}`}>
      <span className="brand-name">Manna College</span>
      <span className="brand-divider" aria-hidden="true" />
      <span className="brand-name">Manna Bible Institute</span>
    </span>
  );
}
