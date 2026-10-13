"use client";

import { Eye, EyeClosed, TriangleAlert, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Field, FieldError, FieldLabel } from "../ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "../ui/input-group";
import { ChangeEvent, Ref, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

const schema = z.object({
  email: z.email("Este não parece ser um email válido"),
  password: z.string().min(1, { message: "Digite uma senha para continuar." }),
});

type FormFields = z.infer<typeof schema>;

const temporaryUser = {
  email: "teste@gmail.com",
  password: "teste123",
};

function LoginForm() {
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
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (
        data.email === temporaryUser.email &&
        data.password === temporaryUser.password
      ) {
        router.push("/projetos");
      } else {
        throw new Error("Email ou senha incorretos");
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
        title="Email"
        id="email"
        {...register("email")}
        error={errors.email?.message}
      />
      <FormPassword
        id="password"
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
          className=" rounded-full w-[60%] p-6 bg-white hover:bg-[#C4D6E5] text-[#0F4C81] font-extrabold"
        >
          {isSubmitting ? "Entrando..." : "Entrar"}
        </Button>
      </div>
    </form>
  );
}

export default LoginForm;

interface FormInputProps {
  title?: string;
  id: string;
  error?: string;
  name?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: ChangeEvent<HTMLInputElement>) => void;
  ref?: Ref<HTMLInputElement>;
  value?: string;
}

export function FormInput({
  title,
  id,
  error,
  ...registerProps
}: FormInputProps) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{title}</FieldLabel>
      <Input
        id={id}
        placeholder={`Digite seu ${title?.toLowerCase()}`}
        className="border-0 border-b-2 border-[#236588] pt-6 pb-6 placeholder:text-[#9BAFC0]"
        {...registerProps}
      />
      {error && (
        <FieldError className="text-xs flex gap-1 items-center">
          <TriangleAlert size={15} /> {error}
        </FieldError>
      )}
    </Field>
  );
}

function FormPassword({
  title = "Senha",
  id,
  error,
  ...registerProps
}: FormInputProps) {
  const [visible, setIsVisible] = useState(false);

  return (
    <Field>
      <FieldLabel htmlFor={id}>{title}</FieldLabel>

      <InputGroup className="rounded-xl border-0 border-b-2 border-[#236588] pt-6 pb-6">
        <InputGroupInput
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          className="placeholder:text-[#9BAFC0]"
          placeholder={`Digite a senha`}
          {...registerProps}
        />

        <InputGroupAddon align="inline-end">
          <InputGroupButton
            aria-label={!visible ? "Mostrar senha" : "Esconder senha"}
            title={!visible ? "Mostrar senha" : "Esconder senha"}
            size="icon-xs"
            type="button"
            className="hover:bg-transparent hover:text-primary-foreground text-[#9BAFC0]"
            onClick={() => setIsVisible((h) => !h)}
          >
            {!visible ? <Eye /> : <EyeClosed />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {error && (
        <FieldError className="text-xs flex gap-1 items-center">
          <TriangleAlert size={15} /> {error}
        </FieldError>
      )}
    </Field>
  );
}
