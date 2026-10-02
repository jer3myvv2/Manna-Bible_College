/**
 * The institution emblem. Swap src/assets/logo.svg for the official logo
 * (keep the same filename) and it updates everywhere.
 */
import logoUrl from '../assets/logo.svg';

export default function Logo({ size = 48, className = '', decorative = false }) {
  return (
    <img
      src={logoUrl}
      width={size}
      height={size}
      className={`logo ${className}`}
      alt={
        decorative
          ? ''
          : 'Manna College and Manna Bible Institute emblem: an open Bible showing Alpha and Omega within a gold laurel wreath'
      }
    />
  );
}
