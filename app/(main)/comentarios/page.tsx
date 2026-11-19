"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { comentariosApi, StockioApiError, type Comentario } from "@/lib/stockio-api";
import { clearSession, readSession, SESSION_CHANGED } from "@/lib/session";

type TipoAvaliacao = "produto" | "loja";

function mensagemErro(erro: unknown): string {
  return erro instanceof Error ? erro.message : "Ocorreu um erro. Tente novamente.";
}

function idPositivo(valor: string): number | null {
  const numero = Number(valor.trim());
  return Number.isSafeInteger(numero) && numero > 0 ? numero : null;
}

function ComentariosContent() {
  const searchParams = useSearchParams();
  const lojaContextId = idPositivo(searchParams.get("avaliacaoLojaId") ?? "");
  const produtoContextId = idPositivo(searchParams.get("avaliacaoProdutoId") ?? "");
  const contextoInicial = lojaContextId ? { tipo: "loja" as const, id: lojaContextId } : produtoContextId ? { tipo: "produto" as const, id: produtoContextId } : null;
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [usuarioId, setUsuarioId] = useState<number | null>(() => readSession()?.userId ?? null);
  const [tipo, setTipo] = useState<TipoAvaliacao>(contextoInicial?.tipo ?? "produto");
  const [avaliacaoId, setAvaliacaoId] = useState(contextoInicial ? String(contextoInicial.id) : "");
  const [conteudo, setConteudo] = useState("");
  const [editando, setEditando] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [reload, setReload] = useState(0);
  const contextual = contextoInicial !== null;

  const carregar = useCallback(() => {
    setCarregando(true);
    setReload((r) => r + 1);
  }, []);

  useEffect(() => {
    let ativo = true;

    async function buscar() {
      try {
        const id = avaliacaoId.trim() ? idPositivo(avaliacaoId) : null;
        if (avaliacaoId.trim() && id === null) {
          if (ativo) setErro("O ID da avaliação deve ser um número inteiro positivo.");
          return;
        }
        const filtro = id === null ? undefined : tipo === "produto" ? { avaliacaoProdutoId: id } : { avaliacaoLojaId: id };
        const data = await comentariosApi.listar(filtro);
        if (ativo) {
          setComentarios(data);
          setErro("");
        }
      } catch (error) {
        if (ativo) {
          if (error instanceof StockioApiError && error.status === 401) { clearSession(); setUsuarioId(null); }
          setErro(mensagemErro(error));
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    void buscar();

    const atualizarSessao = () => setUsuarioId(readSession()?.userId ?? null);
    window.addEventListener(SESSION_CHANGED, atualizarSessao);
    window.addEventListener("storage", atualizarSessao);

    return () => {
      ativo = false;
      window.removeEventListener(SESSION_CHANGED, atualizarSessao);
      window.removeEventListener("storage", atualizarSessao);
    };
  }, [tipo, avaliacaoId, reload]);

  function cancelarEdicao() {
    setEditando(null);
    setConteudo("");
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setAviso("");
    const texto = conteudo.trim();
    if (!texto) { setErro("Escreva o comentário."); return; }
    if (usuarioId === null) { setErro("Entre na sua conta para comentar."); return; }
    const id = idPositivo(avaliacaoId);
    if (editando === null && id === null) {
      setErro("Informe o ID de uma avaliação existente (não o ID do produto ou loja).");
      return;
    }
    setSalvando(true);
    try {
      if (editando === null && id !== null) {
        await comentariosApi.criar({
          conteudo: texto,
          ...(tipo === "produto" ? { avaliacaoProdutoId: id } : { avaliacaoLojaId: id }),
        });
        setAviso("Comentário cadastrado.");
      } else if (editando !== null) {
        await comentariosApi.atualizar(editando, texto);
        setAviso("Comentário atualizado.");
      }
      cancelarEdicao();
      carregar();
    } catch (error) {
      if (error instanceof StockioApiError && error.status === 401) { clearSession(); setUsuarioId(null); }
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  function editar(comentario: Comentario) {
    setEditando(comentario.id);
    setConteudo(comentario.conteudo);
    setErro("");
    setAviso("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function excluir(comentario: Comentario) {
    if (!window.confirm("Excluir este comentário?")) return;
    setErro("");
    setAviso("");
    setSalvando(true);
    try {
      await comentariosApi.excluir(comentario.id);
      if (editando === comentario.id) cancelarEdicao();
      setAviso("Comentário excluído.");
      carregar();
    } catch (error) {
      if (error instanceof StockioApiError && error.status === 401) { clearSession(); setUsuarioId(null); }
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  return <main className="min-h-screen bg-[#F6F3E4] text-[#171918]">
    <header className="bg-black px-5 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm text-white/70 hover:text-white">← Voltar</Link>
        <p className="mt-8 text-sm uppercase tracking-[0.18em] text-[#B7EE00]">{contextual ? "Avaliação selecionada" : "Avaliações"}</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Comentários da avaliação</h1>
        <p className="mt-3 max-w-2xl text-sm text-white/70">Leia as respostas da comunidade e participe da conversa sobre esta avaliação.</p>
      </div>
    </header>

    <div className="mx-auto max-w-5xl space-y-8 px-5 py-10">
      {erro && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{erro}</div>}
      {aviso && <div role="status" className="rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">{aviso}</div>}

      {!contextual && <section className="rounded-3xl bg-white p-6 shadow-sm" aria-labelledby="fallback-filter-title">
        <h2 id="fallback-filter-title" className="text-lg font-semibold">Localizar uma avaliação</h2>
        <p className="mt-1 text-sm text-gray-600">Este filtro aparece somente quando a página é aberta fora do contexto de uma avaliação.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">Tipo<select value={tipo} disabled={editando !== null} onChange={event => setTipo(event.target.value as TipoAvaliacao)} className="mt-1 w-full rounded-full border border-gray-200 bg-[#F6F3E4] px-4 py-3"><option value="produto">Produto</option><option value="loja">Loja</option></select></label>
          <label className="text-sm font-medium">Identificador da avaliação<input type="number" min={1} step={1} value={avaliacaoId} disabled={editando !== null} onChange={event => setAvaliacaoId(event.target.value)} className="mt-1 w-full rounded-full border border-gray-200 bg-[#F6F3E4] px-4 py-3" /></label>
        </div>
      </section>}

      <section aria-labelledby="comments-title">
        <div className="flex items-center justify-between gap-4"><h2 id="comments-title" className="text-2xl font-semibold">Comentários</h2><button type="button" onClick={carregar} disabled={carregando} className="text-sm font-semibold text-[#6A38F3] disabled:opacity-50">Atualizar</button></div>
        {carregando ? <p role="status" className="py-12 text-center text-gray-600">Carregando comentários...</p> : comentarios.length === 0 ? <div className="mt-5 rounded-3xl bg-white p-8 text-center text-gray-600">Nenhum comentário foi publicado nesta avaliação.</div> : <div className="mt-5 divide-y divide-gray-200 rounded-3xl bg-white px-6 shadow-sm">
          {comentarios.map(comentario => <article key={comentario.id} className="flex gap-4 py-6">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-black font-semibold text-white" aria-hidden="true">{comentario.usuario?.nome.trim().slice(0, 1).toUpperCase() || "?"}</div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{comentario.usuario?.nome || "Usuário"}{comentario.usuario?.username && <span className="ml-2 text-sm font-normal text-gray-500">@{comentario.usuario.username}</span>}</p>
                {usuarioId !== null && Number(comentario.usuarioId) === usuarioId && <div className="flex gap-3 text-sm"><button type="button" disabled={salvando} onClick={() => editar(comentario)} className="text-[#6A38F3]">Editar</button><button type="button" disabled={salvando} onClick={() => void excluir(comentario)} className="text-red-600">Excluir</button></div>}
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">{comentario.conteudo}</p>
            </div>
          </article>)}
        </div>}
      </section>

      {usuarioId !== null ? <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">{editando === null ? "Adicionar comentário" : "Editar comentário"}</h2>
        <form onSubmit={salvar} className="mt-4">
          <label htmlFor="conteudo" className="sr-only">Comentário</label>
          <textarea id="conteudo" required maxLength={2000} rows={editando === null ? 2 : 5} value={conteudo} onChange={event => setConteudo(event.target.value)} className="w-full resize-y rounded-2xl border border-gray-200 bg-[#F6F3E4] p-4 outline-none focus:border-[#6A38F3]" placeholder="Adicione um comentário..." />
          <div className="mt-3 flex justify-end gap-3">{editando !== null && <button type="button" onClick={cancelarEdicao} className="rounded-full border border-gray-300 px-5 py-2">Cancelar</button>}<button type="submit" disabled={salvando || (!contextual && !idPositivo(avaliacaoId))} className="rounded-full bg-[#6A38F3] px-6 py-2 font-semibold text-white disabled:opacity-50">{salvando ? "Salvando..." : editando === null ? "Comentar" : "Salvar"}</button></div>
        </form>
      </section> : <div className="rounded-3xl bg-white p-6 text-center">Para comentar, <Link href="/login" className="font-semibold text-[#6A38F3]">faça login</Link>.</div>}
    </div>
  </main>;
}

export default function ComentariosPage() {
  return <Suspense fallback={<main className="min-h-screen bg-[#F6F3E4] p-10 text-center" role="status">Carregando comentários...</main>}><ComentariosContent /></Suspense>;
}
