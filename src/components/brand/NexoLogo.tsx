import Image from 'next/image';

type Props = {
  /** `brand` = logo branca do login; `app` = logo das shells; `mark` = N encolhido */
  variant?: 'brand' | 'app' | 'mark';
  className?: string;
  /** Altura em px (largura proporcional). */
  height?: number;
  /** Se false com `app`, usa só o mark N (compatível com rail). */
  showWordmark?: boolean;
};

const ASSETS = {
  brand: {
    src: '/brand/nexo-brand.png',
    width: 130,
    height: 24,
    alt: 'Nexo Assist',
  },
  app: {
    src: '/brand/nexo-logo.png',
    width: 136,
    height: 20,
    alt: 'Nexo Assist',
  },
  mark: {
    src: '/brand/nexo-mark-collapsed.png',
    width: 40,
    height: 40,
    alt: 'Nexo Assist',
  },
  markLegacy: {
    src: '/brand/nexo-mark.png',
    width: 36,
    height: 20,
    alt: 'Nexo Assist',
  },
} as const;

/**
 * Logos oficiais:
 * - brand → tela de login (branco)
 * - app → sidebar expandido / shells
 * - mark → sidebar encolhido (anexo Logo)
 */
export function NexoLogo({ variant = 'app', className = '', height, showWordmark = true }: Props) {
  const asset =
    variant === 'mark'
      ? ASSETS.mark
      : !showWordmark && variant === 'app'
        ? ASSETS.markLegacy
        : ASSETS[variant];
  const h = height ?? asset.height;
  const w = Math.round((asset.width / asset.height) * h);

  return (
    <Image
      src={asset.src}
      alt={asset.alt}
      width={w}
      height={h}
      className={`object-contain object-left ${className}`}
      style={{ width: w, height: h }}
      priority
    />
  );
}
