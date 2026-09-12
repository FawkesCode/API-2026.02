import Image from "next/image";

function LogoSidebar() {
  return (
    <div className="flex justify-center">
      <Image src="/logo.svg" alt="Logo da Altave" width={75} height={75} />
    </div>
  );
}

export default LogoSidebar;
