import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const nome = String(formData.get("nome") || "");
    const cpf = String(formData.get("cpf") || "");
    const carteirinha = String(formData.get("carteirinha") || "");
    const procedimento = String(formData.get("procedimento") || "");
    const data = String(formData.get("data") || "");
    const horario = String(formData.get("horario") || "");
    const unidade = String(formData.get("unidade") || "");
    const dentista = String(formData.get("dentista") || "");

    const arquivo = formData.get("arquivo") as File | null;

    const descricao = `
Beneficiário: ${nome}

CPF: ${cpf}

Carteirinha: ${carteirinha}

Procedimento: ${procedimento}

Data agendada: ${data}
Horário: ${horario}

Unidade: ${unidade}

Dentista: ${dentista}
`;

    const responseTask = await fetch(
      `https://api.clickup.com/api/v2/list/${process.env.CLICKUP_LIST_ID}/task`,
      {
        method: "POST",
        headers: {
          Authorization: process.env.CLICKUP_API_TOKEN || "",
          "Content-Type": "application/json",
        },
      body: JSON.stringify({
  name: `Encaminhamento - ${nome}`,
  description: descricao,
}),
      }
    );

    const task = await responseTask.json();

    if (!responseTask.ok) {
      return NextResponse.json(
        {
          success: false,
          etapa: "criar_task",
          error: task,
        },
        { status: 500 }
      );
    }

    if (arquivo) {
      const uploadForm = new FormData();
      uploadForm.append("attachment", arquivo, arquivo.name);

      const responseAnexo = await fetch(
        `https://api.clickup.com/api/v2/task/${task.id}/attachment`,
        {
          method: "POST",
          headers: {
            Authorization: process.env.CLICKUP_API_TOKEN || "",
          },
          body: uploadForm,
        }
      );

      const anexo = await responseAnexo.json();

      if (!responseAnexo.ok) {
        return NextResponse.json(
          {
            success: false,
            etapa: "anexar_arquivo",
            task,
            error: anexo,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        task,
        anexo,
      });
    }

    return NextResponse.json({
      success: true,
      task,
      anexo: null,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}