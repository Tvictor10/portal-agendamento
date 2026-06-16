import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../services/supabaseAdmin";

function obterDataAmanhaISO() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  const ano = amanha.getFullYear();
  const mes = String(amanha.getMonth() + 1).padStart(2, "0");
  const dia = String(amanha.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

export async function GET() {
  try {
    const dataAmanha = obterDataAmanhaISO();

    const { data: agendamentos, error } = await supabaseAdmin
      .from("agendamentos_whatsapp")
      .select("*")
      .eq("status_envio", "pendente")
      .eq("data_agendamento", dataAmanha);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          etapa: "buscar_agendamentos",
          error: error.message,
        },
        { status: 500 }
      );
    }

    const resultados = [];

    for (const agendamento of agendamentos || []) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/rd-whatsapp`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              nome: agendamento.nome || "",
              telefone: agendamento.telefone || "",
              data: agendamento.data_agendamento,
              horario: agendamento.horario || "",
              unidade: agendamento.unidade || "",
              dentista: agendamento.dentista || "",
            }),
          }
        );

        const respostaWhatsapp = await response.json();

        if (!response.ok || !respostaWhatsapp.success) {
          throw new Error(
            respostaWhatsapp.error ||
              respostaWhatsapp.message ||
              "Erro ao enviar WhatsApp"
          );
        }

        await supabaseAdmin
          .from("agendamentos_whatsapp")
          .update({
            status_envio: "enviado",
            enviado_em: new Date().toISOString(),
          })
          .eq("id", agendamento.id);

        resultados.push({
          id: agendamento.id,
          nome: agendamento.nome,
          status: "enviado",
        });
      } catch (erroEnvio: any) {
        await supabaseAdmin
          .from("agendamentos_whatsapp")
          .update({
            status_envio: "erro",
          })
          .eq("id", agendamento.id);

        resultados.push({
          id: agendamento.id,
          nome: agendamento.nome,
          status: "erro",
          erro: erroEnvio.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      dataProcessada: dataAmanha,
      quantidade: agendamentos?.length || 0,
      resultados,
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