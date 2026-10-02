/** @format */

const logoBig = "/vitr/logo-big.webp";
const logoSmall = "/vitr/logo-small.webp";
import { APP_CONFIG } from "@/config/app";
import { ImageSkeleton } from "../ui/image-skeleton";

export function LogoBig() {
  return (
    <ImageSkeleton
      src={logoBig}
      alt={`${APP_CONFIG.name} Logo`}
      width={160}
      height={160}
      objectFit="contain"
    />
  );
}

export function Logo() {
  return (
    <ImageSkeleton
      src={logoSmall}
      alt={`${APP_CONFIG.name} Logo`}
      width={40}
      height={40}
      objectFit="contain"
    />
  );
}

/** Square mark for narrow slots (e.g. footer brand column). */
export function LogoAboveText({ className }: { className?: string } = {}) {
  return (
    <ImageSkeleton
      src={logoSmall}
      alt={`${APP_CONFIG.name} Logo`}
      width={56}
      height={56}
      objectFit="contain"
      className={className}
    />
  );
}

export function Icon({ className, large = false }: { className?: string; large?: boolean } = {}) {
  const width = className ? undefined : large ? 96 : 32;
  const height = className ? undefined : large ? 96 : 32;
  return (
    <ImageSkeleton
      src={large ? logoBig : logoSmall}
      alt={`${APP_CONFIG.name} Icon`}
      width={width}
      height={height}
      className={className}
    />
  );
}

export function TextLogo({ className }: { className?: string } = {}) {
  return (
    <ImageSkeleton
      src={logoSmall}
      alt={`${APP_CONFIG.name} Text Logo`}
      width={className ? undefined : 40}
      height={className ? undefined : 40}
      className={className}
    />
  );
}

export function LogoXS({ className }: { className?: string } = {}) {
  return (
    <ImageSkeleton
      src={logoSmall}
      alt={`${APP_CONFIG.name} Logo`}
      width={className ? undefined : 40}
      height={className ? undefined : 40}
      className={className}
    />
  );
}
