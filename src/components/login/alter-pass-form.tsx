import { SubmitHandler, useForm } from "react-hook-form";
import { FormPassword } from "./login-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../ui/button";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

const schema = z.object({
  password: z
    .string()
    .min(8, { message: "Precisa ter no mínimo 8 caracteres" })
    .regex(/[A-Z]/, { message: "Deve conter pelo menos uma letra maiúscula." })
    .regex(/[a-z]/, { message: "Deve conter pelo menos uma letra minúscula." })
    .regex(/[0-9]/, "Deve conter pelo menos um número")
    .regex(/[^A-Za-z0-9]/, "Deve conter pelo menos um caractere especial"),
  confirmPassword: z
    .string()
    .min(1, { message: "Informe a senha criada para continuar." }),
});

type FormFields = z.infer<typeof schema>;

function AlterPassForm() {
  const {
    register,
    formState: { errors, isSubmitting, isValid },
    handleSubmit,
    setError,
  } = useForm<FormFields>({
    defaultValues: { password: "", confirmPassword: "" },
    resolver: zodResolver(schema),
    mode: "onTouched",
  });
  const router = useRouter();

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (data.password !== data.confirmPassword) {
        throw new Error("As senhas precisam estar iguais para prosseguir");
      }

      router.push("/projetos");
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
      <FormPassword
        title="Nova Senha"
        id="password"
        {...register("password")}
        error={errors.password?.message}
      />

      <FormPassword
        title="Confirmar Senha"
        id="confirmPassword"
        {...register("confirmPassword")}
        error={errors.confirmPassword?.message}
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
          className=" rounded-full w-[60%] p-6 bg-white hover:bg-[#C4D6E5] text-[#0F4C81] font-extrabold"
        >
          {isSubmitting ? "Trocando" : "Trocar Senha"}
        </Button>
      </div>
    </form>
  );
}

export default AlterPassForm;
