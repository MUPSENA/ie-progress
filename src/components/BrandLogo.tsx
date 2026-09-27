import Image from "next/image";

export function BrandLogo({ className = "", priority = false }: { className?: string; priority?: boolean }) {
  return (
    <span className={`auri-logo ${className}`.trim()}>
      <Image src="/auri-logo.png" alt="Auri+" width={300} height={104} priority={priority} />
    </span>
  );
}
