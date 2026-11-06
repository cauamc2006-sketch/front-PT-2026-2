"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { lojasApi, type Loja } from "@/lib/stockio-api";
import { readSession, SESSION_CHANGED } from "@/app/stock-profile/session";

type FormState = { nome: string; descricao: string };
const vazio: FormState = { nome: "", descricao: "" };

function mensagemErro(erro: unknown): string {
  return erro instanceof Error ? erro.message : "Não foi possível concluir a operação.";
}

export default function LojasPage() {
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [usuarioId, setUsuarioId] = useState<number | null>(() => readSession()?.userId ?? null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [formulario, setFormulario] = useState<FormState>(vazio);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [reload, setReload] = useState(0);

  const carregar = useCallback(() => {
    setCarregando(true);
    setReload((r) => r + 1);
  }, []);

  useEffect(() => {
    let ativo = true;

    lojasApi
      .listar()
      .then((data) => {
        if (ativo) {
          setLojas(data);
          setErro("");
        }
      })
      .catch((e: unknown) => {
        if (ativo) {
          setErro(mensagemErro(e));
        }
      })
      .finally(() => {
        if (ativo) {
          setCarregando(false);
        }
      });

    const atualizarSessao = () => setUsuarioId(readSession()?.userId ?? null);
    window.addEventListener(SESSION_CHANGED, atualizarSessao);
    window.addEventListener("storage", atualizarSessao);

    return () => {
      ativo = false;
      window.removeEventListener(SESSION_CHANGED, atualizarSessao);
      window.removeEventListener("storage", atualizarSessao);
    };
  }, [reload]);

  function cancelar() {
    setEditandoId(null);
    setFormulario(vazio);
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setAviso("");
    const nome = formulario.nome.trim();
    const descricao = formulario.descricao.trim();
    if (!nome) {
      setErro("Informe o nome da loja.");
      return;
    }
    setSalvando(true);
    try {
      if (editandoId === null) {
        await lojasApi.criar({ nome, descricao });
        setAviso("Loja cadastrada com sucesso.");
      } else {
        await lojasApi.atualizar(editandoId, { nome, descricao });
        setAviso("Loja atualizada com sucesso.");
      }
      cancelar();
      carregar();
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setSalvando(false);
    }
  }

  function editar(loja: Loja) {
    setEditandoId(loja.id);
    setFormulario({ nome: loja.nome, descricao: loja.descricao ?? "" });
    setErro("");
    setAviso("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function excluir(loja: Loja) {
    if (!window.confirm(`Excluir a loja "${loja.nome}"? Produtos associados podem ser apagados pelo banco.`)) return;
    setErro("");
    setAviso("");
    setSalvando(true);
    try {
      await lojasApi.excluir(loja.id);
      if (editandoId === loja.id) cancelar();
      setAviso("Loja excluída.");
      carregar();
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F6F3E4] px-5 py-10 text-[#171918]">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-2">
          <Link href="/" className="text-sm font-semibold text-[#6A38F3] hover:underline">Voltar ao início</Link>
          <h1 className="text-4xl font-extrabold">Lojas</h1>
          <p className="text-gray-600">Consulte lojas cadastradas e gerencie as suas.</p>
        </header>

        {erro && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{erro}</div>}
        {aviso && <div role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">{aviso}</div>}

        {usuarioId !== null ? (
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold">{editandoId === null ? "Cadastrar loja" : "Editar loja"}</h2>
            <form onSubmit={salvar} className="space-y-4">
              <div>
                <label htmlFor="nome" className="mb-1 block font-medium">Nome</label>
                <input id="nome" required maxLength={255} value={formulario.nome} onChange={(e) => setFormulario((prev) => ({ ...prev, nome: e.target.value }))} className="w-full rounded-xl border border-gray-300 p-3 focus:outline-[#6A38F3]" placeholder="Nome da loja" />
              </div>
              <div>
                <label htmlFor="descricao" className="mb-1 block font-medium">Descrição</label>
                <textarea id="descricao" rows={3} value={formulario.descricao} onChange={(e) => setFormulario((prev) => ({ ...prev, descricao: e.target.value }))} className="w-full rounded-xl border border-gray-300 p-3 focus:outline-[#6A38F3]" placeholder="O que sua loja oferece?" />
              </div>
              <div className="flex flex-wrap gap-3">
                <button disabled={salvando} type="submit" className="rounded-xl bg-[#6A38F3] px-6 py-3 font-semibold text-white disabled:opacity-50">{salvando ? "Salvando..." : editandoId === null ? "Cadastrar" : "Salvar alterações"}</button>
                {editandoId !== null && <button type="button" onClick={cancelar} className="rounded-xl border border-gray-300 px-6 py-3">Cancelar</button>}
              </div>
            </form>
          </section>
        ) : (
          <div className="rounded-2xl bg-white p-5">Para criar ou gerenciar suas lojas, <Link className="font-semibold text-[#6A38F3] underline" href="/login">entre na sua conta</Link>.</div>
        )}

        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold">Lojas cadastradas</h2>
            <button type="button" disabled={carregando} onClick={carregar} className="rounded-xl border border-[#6A38F3] px-4 py-2 text-sm font-semibold text-[#6A38F3] disabled:opacity-50">Atualizar</button>
          </div>
          {carregando ? <p role="status">Carregando lojas...</p> : lojas.length === 0 ? <p>Nenhuma loja encontrada.</p> : (
            <div className="grid gap-4 sm:grid-cols-2">
              {lojas.map((loja) => (
                <article key={loja.id} className="rounded-3xl bg-white p-6 shadow-sm">
                  <h3 className="text-xl font-bold">{loja.nome}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-gray-600">{loja.descricao || "Sem descrição."}</p>
                  {usuarioId !== null && Number(loja.usuarioId) === usuarioId && (
                    <div className="mt-5 flex gap-2">
                      <button disabled={salvando} type="button" onClick={() => editar(loja)} className="rounded-lg border border-[#6A38F3] px-4 py-2 text-sm font-medium text-[#6A38F3] disabled:opacity-50">Editar</button>
                      <button disabled={salvando} type="button" onClick={() => void excluir(loja)} className="rounded-lg border border-red-500 px-4 py-2 text-sm font-medium text-red-600 disabled:opacity-50">Excluir</button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
