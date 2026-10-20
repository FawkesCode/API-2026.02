"use client";

import { X } from "lucide-react";
import { Button } from "../ui/button";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { FormInput, FormPassword } from "../form/form-field";

const schema = z.object({
  email: z.email("Este não parece ser um email válido"),
  password: z.string().min(1, { message: "Digite uma senha para continuar." }),
});

type FormFields = z.infer<typeof schema>;

function LoginForm({ onTempPass }: { onTempPass: () => void }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormFields>({
    defaultValues: { email: "", password: "" },
    resolver: zodResolver(schema),
    mode: "onTouched",
  });
  const router = useRouter();

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, senha: data.password }),
      });
      const result = (await response.json()) as {
        erro?: string;
        senhaProvisoria?: boolean;
      };

      if (!response.ok) {
        throw new Error(result.erro ?? "Não foi possível entrar.");
      }

      if (result.senhaProvisoria) {
        onTempPass();
      } else {
        router.replace("/projetos");
        router.refresh();
      }
    } catch (error) {
      const err = error as Error;
      setError("root", { message: err.message });
    }
  };

  return (
    <form
      className="flex flex-col gap-6 items-center"
      onSubmit={handleSubmit(onSubmit)}
    >
      <FormInput
        variant="login"
        label="Email"
        id="email"
        placeholder="Digite seu email"
        {...register("email")}
        error={errors.email?.message}
      />
      <FormPassword
        variant="login"
        label="Senha"
        id="password"
        placeholder="Digite sua senha"
        {...register("password")}
        error={errors.password?.message}
      />

      <div className="mt-2 flex flex-col w-full items-center gap-4">
        {errors?.root && (
          <div className="text-xs text-destructive bg-[#cbddec] p-2 rounded-full font-bold flex gap-2 items-center pr-4 pl-4">
            <div className="border-destructive border-2 rounded-full p-1">
              <X size={10} strokeWidth={4} />
            </div>

            <p>{errors?.root.message}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting || !isValid}
          className="rounded-full w-[50%] sm:w-[60%]  bg-white hover:bg-[#C4D6E5] text-[#0F4C81] font-extrabold text-xs p-5 sm:text-regular sm:p-6"
        >
          {isSubmitting ? "Entrando..." : "Entrar"}
        </Button>
      </div>
    </form>
  );
}

export default LoginForm;
