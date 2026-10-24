/** Shared app mark: use the favicon artwork everywhere STARRY is represented. */
export default function BrandIcon({ size = 44 }: { size?: number }) {
  return (
    <img
      className="brand-icon"
      src={`${import.meta.env.BASE_URL}icon.svg`}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
    />
  );
}
