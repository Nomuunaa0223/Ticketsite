import Image from "next/image";

export function LogoMark() {
  return (
    <Image
      src="/brand/logo.png"
      alt=""
      aria-hidden="true"
      width={40}
      height={40}
      priority
      className="h-9 w-9 shrink-0 object-contain"
    />
  );
}
