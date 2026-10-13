"use client";

import { Eye, EyeClosed, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Field, FieldLabel } from "../ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "../ui/input-group";
import { useState } from "react";

function LoginForm() {
  return (
    <form className="flex flex-col gap-6 items-center ">
      <FormInput title="Email" id="email" />
      <FormPassword id="password" />

      <div className="mt-6 flex flex-col w-full items-center gap-4">
        {/* <div className="text-xs text-destructive bg-[#cbddec] p-2 rounded-full font-bold flex gap-2 items-center pr-4 pl-4">
          <div className="border-destructive border-2 rounded-full p-1">
            <X size={10} strokeWidth={4} />
          </div>

          <p>Email ou senha incorretos. Tente novamente!</p>
        </div> */}

        <Button className=" rounded-full w-[60%] p-6 bg-white hover:bg-[#C4D6E5] text-[#0F4C81] font-extrabold">
          Entrar
        </Button>
      </div>
    </form>
  );
}

export default LoginForm;

function FormInput({ title, id }: { title: string; id: string }) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{title}</FieldLabel>
      <Input
        className="border-0 border-b-2 border-[#236588] pt-6 pb-6 placeholder:text-[#9BAFC0]"
        placeholder={`Digite seu ${title.toLowerCase()}`}
      />
    </Field>
  );
}

function FormPassword({ id }: { id: string }) {
  const [visible, setIsVisible] = useState(false);

  return (
    <Field>
      <FieldLabel htmlFor={id}>Senha</FieldLabel>

      <InputGroup className="rounded-xl border-0 border-b-2 border-[#236588] pt-6 pb-6">
        <InputGroupInput
          id={id}
          type={visible ? "text" : "password"}
          className="placeholder:text-[#9BAFC0]"
          placeholder={`Digite a senha`}
        />

        <InputGroupAddon align="inline-end">
          <InputGroupButton
            aria-label={!visible ? "Mostrar senha" : "Esconder senha"}
            title={!visible ? "Mostrar senha" : "Esconder senha"}
            size="icon-xs"
            className="hover:bg-transparent hover:text-primary-foreground"
            onClick={() => setIsVisible((h) => !h)}
          >
            {!visible ? <Eye /> : <EyeClosed />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  );
}
