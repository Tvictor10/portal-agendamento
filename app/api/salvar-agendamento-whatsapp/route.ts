import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../services/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      nome,
      telefone,
      carteirinha,
      idAtendimento,
      data,
      horario,
      unidade,
      dentista,
    } = body;

    const [dia, mes, ano] = String(data).split("/");

    const dataISO = `${ano}-${mes}-${dia}`;

    const { error } = await supabaseAdmin
      .from("agendamentos_whatsapp")
      .insert({
        nome,
        telefone,
        carteirinha,
        id_atendimento: idAtendimento || null,
        data_agendamento: dataISO,
        horario,
        unidade,
        dentista,
        status_envio: "pendente",
      });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
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