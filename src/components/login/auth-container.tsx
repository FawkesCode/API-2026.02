"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import AlterPassForm from "@/components/login/alter-pass-form";
import LoginForm from "@/components/login/login-form";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import SvgContainer from "./svg-container";

gsap.registerPlugin(useGSAP);

function AuthContainer() {
  const formRef = useRef(null);
  const svgRef = useRef(null);
  const [tl, setTl] = useState<gsap.core.Timeline | null>(null);
  const [alterPass, setAlterPass] = useState(false);

  const { contextSafe } = useGSAP(() => {
    gsap.from(formRef.current, {
      y: 50,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
    });

    gsap.from(svgRef.current, {
      y: 50,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
    });

    const timeline = gsap.timeline({ paused: true });
    timeline.to(
      svgRef.current,
      { y: "110%", opacity: 0.5, ease: "power4.in" },
      0,
    );
    timeline.to(formRef.current, { x: "50%", ease: "power4.out" }, 0.5);

    setTl(timeline);
  }, []);

  const handleTempPassword = contextSafe(() => {
    const isDesktop = window.innerWidth >= 1024;
    if (tl && isDesktop) {
      tl.play();
    }
    setAlterPass(true);
  });

  return (
    <>
      <section
        ref={formRef}
        className="w-full md:w-120 lg:w-130 flex flex-col gap-2 justify-center  items-center"
      >
        <div className=" h-[80%] min-h-min w-[95%] sm:w-full rounded-[10px] border border-[rgb(34,107,144)] bg-linear-to-b from-[#05325A] to-[#02406B] text-white pt-10 pb-10 sm:p-8 sm:pt-14 sm:pb-14 xl:p-15 xl:pt-18 xl:pb-18 flex flex-col gap-8  *:w-[90%] xl:*:w-full items-center overflow-hidden ml-2 mr-2 sm:m-0">
          <div className="flex flex-col gap-1 justify-center items-center">
            <Image
              src="/login-altave-logo.svg"
              alt="logo altave"
              width={80}
              height={80}
            />
            <h2 className=" text-[24px] sm:text-[28px] xl:text-[32px] font-bold mt-8">
              {alterPass ? "Ops, altere sua senha!" : "Bem vindo de volta!"}
            </h2>
            <p className="text-[#8CA4B7] text-center w-[90%] sm:w-full text-xs xl:text-sm">
              {alterPass
                ? "Senha provisória, antes de entrar, troque-a, por favor!"
                : "Faça login para acessar a plataforma"}
            </p>
          </div>
          {alterPass ? (
            <AlterPassForm />
          ) : (
            <LoginForm onTempPass={handleTempPassword} />
          )}

          <div className="relative h-110 rounded-[300] bg-[#00598A] w-full block sm:hidden">
            <SvgContainer />
          </div>
        </div>
        {!alterPass && (
          <p className="text-xs text-[#C4D6E5]">
            Não lembra a sua senha? Redefinir
          </p>
        )}
      </section>

      <section
        ref={svgRef}
        className="hidden sm:flex justify-center overflow-hidden lg:overflow-visible  items-center  min-w-screen min-h-[60vh] lg:min-w-auto   "
      >
        <div className="h-[105%]  sm:bg-transparent lg:bg-[#00598A] w-full lg:w-120 xl:w-130  rounded-[300] relative">
          <SvgContainer />
        </div>
      </section>
    </>
  );
}

export default AuthContainer;
