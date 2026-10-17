import { describe, expect, it } from "vitest";
import {
  OPCOES_TIPO_CONTA,
  REGRAS_SENHA,
  usuarioFormSchema,
} from "@/schemas/usuario-form.schema";

function dadosValidos() {
  return {
    email: "tecnico@altave.com",
    nome: "João Técnico",
    tipoConta: OPCOES_TIPO_CONTA[0],
    senha: "Senha@123",
    confirmarSenha: "Senha@123",
  };
}

describe("usuarioFormSchema", () => {
  it("aceita dados válidos para cadastro de conta", () => {
    const resultado = usuarioFormSchema.safeParse(dadosValidos());
    expect(resultado.success).toBe(true);
  });

  it("rejeita campos obrigatórios vazios", () => {
    const resultado = usuarioFormSchema.safeParse({
      email: "",
      nome: "   ",
      tipoConta: null,
      senha: "",
      confirmarSenha: "",
    });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      const camposComErro = resultado.error.issues.map((issue) => issue.path[0]);
      expect(camposComErro).toContain("email");
      expect(camposComErro).toContain("nome");
      expect(camposComErro).toContain("tipoConta");
      expect(camposComErro).toContain("senha");
      expect(camposComErro).toContain("confirmarSenha");
    }
  });

  it("rejeita confirmação de senha diferente da senha", () => {
    const resultado = usuarioFormSchema.safeParse({
      ...dadosValidos(),
      confirmarSenha: "OutraSenha@123",
    });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["confirmarSenha"],
            message: "As senhas não coincidem.",
          }),
        ]),
      );
    }
  });

  it("valida individualmente cada regra da senha em REGRAS_SENHA", () => {
    const [tamanho, minuscula, maiuscula, numero, especial] = REGRAS_SENHA;

    expect(tamanho.validar("Ab1@567")).toBe(false);
    expect(tamanho.validar("Ab1@5678")).toBe(true);

    expect(minuscula.validar("SENHA@123")).toBe(false);
    expect(minuscula.validar("Senha@123")).toBe(true);

    expect(maiuscula.validar("senha@123")).toBe(false);
    expect(maiuscula.validar("Senha@123")).toBe(true);

    expect(numero.validar("Senha@abc")).toBe(false);
    expect(numero.validar("Senha@123")).toBe(true);

    expect(especial.validar("Senha1234")).toBe(false);
    expect(especial.validar("Senha@123")).toBe(true);
  });
});
