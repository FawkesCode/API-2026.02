import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import Image from "next/image";
import { useRef } from "react";

function SvgContainer() {
  const balloon1Ref = useRef(null);
  const balloon2Ref = useRef(null);
  const balloon3Ref = useRef(null);

  useGSAP(() => {
    gsap.to(balloon1Ref.current, {
      y: -15,
      x: -10,
      duration: 4,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });

    gsap.to(balloon2Ref.current, {
      y: -12,
      x: 12,
      duration: 3.2,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      delay: 0.5,
    });

    gsap.to(balloon3Ref.current, {
      y: -10,
      x: 5,
      duration: 2.8,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      delay: 1,
    });
  }, []);

  return (
    <>
      <div
        ref={balloon1Ref}
        className="absolute w-75 sm:w-80 lg:w-100 xl:w-130 aspect-square  bottom-[5%] -left-5 sm:bottom-1 sm:left-[10%] md:bottom-8 md:left-[20%] lg:bottom-15 lg:-left-5 xl:bottom-[-2%] xl:right-10"
      >
        <Image
          src="/ballon-1.svg"
          alt="balão ilustrativo"
          fill
          className="object-contain"
        />
      </div>

      <div
        ref={balloon2Ref}
        className="absolute w-45 sm:w-62.5 lg:w-75 xl:w-80 aspect-square bottom-10 right-10 sm:bottom-10 sm:right-[15%] md:bottom-10 md:right-[25%] lg:bottom-10 xl:bottom-[5%] lg:right-15"
      >
        <Image
          src="/ballon-2.svg"
          alt="balão ilustrativo"
          fill
          className="object-contain"
        />
      </div>

      <div
        ref={balloon3Ref}
        className="absolute w-30 sm:w-45 lg:w-50 xl:w-62.5 aspect-square right-15 top-5 sm:top-0 sm:right-[20%] md:right-[30%] md:top-[-2] lg:top-5 lg:right-25"
      >
        <Image
          src="/ballon-3.svg"
          alt="balão ilustrativo"
          fill
          className="object-contain"
        />
      </div>
    </>
  );
}

export default SvgContainer;
