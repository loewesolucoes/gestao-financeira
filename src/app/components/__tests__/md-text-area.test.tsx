import { requestFormSubmit } from "../md-text-area";

describe("requestFormSubmit", () => {
  it("chama requestSubmit no formulário mais próximo, quando disponível (atalho Ctrl/Cmd+Enter)", () => {
    document.body.innerHTML = `
      <form id="alvo">
        <div id="dentro-do-form"></div>
      </form>
    `;

    const form = document.getElementById("alvo") as HTMLFormElement;
    const element = document.getElementById("dentro-do-form")!;

    form.requestSubmit = jest.fn();

    requestFormSubmit(element);

    expect(form.requestSubmit).toHaveBeenCalledTimes(1);
  });

  it("dispara um evento de submit manualmente quando requestSubmit não está disponível", () => {
    document.body.innerHTML = `
      <form id="alvo">
        <div id="dentro-do-form"></div>
      </form>
    `;

    const form = document.getElementById("alvo") as HTMLFormElement;
    const element = document.getElementById("dentro-do-form")!;

    (form as any).requestSubmit = undefined;

    const onSubmit = jest.fn();
    form.addEventListener("submit", onSubmit);

    requestFormSubmit(element);

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("não faz nada quando o elemento não está dentro de um formulário", () => {
    document.body.innerHTML = `<div id="solto"></div>`;

    const element = document.getElementById("solto")!;

    expect(() => requestFormSubmit(element)).not.toThrow();
  });

  it("não faz nada quando o elemento é nulo/indefinido", () => {
    expect(() => requestFormSubmit(null)).not.toThrow();
    expect(() => requestFormSubmit(undefined)).not.toThrow();
  });
});
