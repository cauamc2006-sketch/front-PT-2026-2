"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { comentariosApi, type Comentario } from "@/lib/stockio-api";
import { readSession, SESSION_CHANGED } from "@/app/stock-profile/session";

type TipoAvaliacao = "produto" | "loja";

function mensagemErro(erro: unknown): string {
  return erro instanceof Error ? erro.message : "Ocorreu um erro. Tente novamente.";
}

function idPositivo(valor: string): number | null {
  const numero = Number(valor.trim());
  return Number.isSafeInteger(numero) && numero > 0 ? numero : null;
}

export default function ComentariosPage() {
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [usuarioId, setUsuarioId] = useState<number | null>(() => readSession()?.userId ?? null);
  const [tipo, setTipo] = useState<TipoAvaliacao>("produto");
  const [avaliacaoId, setAvaliacaoId] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [editando, setEditando] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [reload, setReload] = useState(0);

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
        if (ativo) setErro(mensagemErro(error));
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
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F6F3E4] px-5 py-10 text-[#171918]">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-2">
          <Link href="/" className="text-sm font-semibold text-[#6A38F3] hover:underline">Voltar ao início</Link>
          <h1 className="text-4xl font-extrabold">Comentários</h1>
          <p className="text-gray-600">Comentários vinculados às avaliações de lojas e produtos.</p>
        </header>

        {erro && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{erro}</div>}
        {aviso && <div role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">{aviso}</div>}

        <section className="space-y-4 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Escolher avaliação</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="tipo-avaliacao" className="mb-1 block font-medium">Tipo</label>
              <select id="tipo-avaliacao" value={tipo} disabled={editando !== null} onChange={e => setTipo(e.target.value as TipoAvaliacao)} className="w-full rounded-xl border border-gray-300 p-3">
                <option value="produto">Avaliação de produto</option>
                <option value="loja">Avaliação de loja</option>
              </select>
            </div>
            <div>
              <label htmlFor="id-avaliacao" className="mb-1 block font-medium">ID da avaliação</label>
              <input id="id-avaliacao" type="number" min={1} step={1} value={avaliacaoId} disabled={editando !== null} onChange={e => setAvaliacaoId(e.target.value)} placeholder="Ex.: 1" className="w-full rounded-xl border border-gray-300 p-3" />
            </div>
          </div>
          <p className="text-sm text-gray-600">O ID aqui é o da <strong>avaliação</strong>, não o do produto ou da loja. Deixe vazio para ver todos os comentários.</p>
          <button type="button" onClick={carregar} disabled={carregando} className="rounded-xl border border-[#6A38F3] px-5 py-2 font-semibold text-[#6A38F3] disabled:opacity-50">Atualizar lista</button>
        </section>

        {usuarioId !== null ? (
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold">{editando === null ? "Novo comentário" : "Editar comentário"}</h2>
            <form onSubmit={salvar} className="space-y-4">
              <div>
                <label htmlFor="conteudo" className="mb-1 block font-medium">Comentário</label>
                <textarea id="conteudo" required rows={4} value={conteudo} onChange={e => setConteudo(e.target.value)} className="w-full rounded-xl border border-gray-300 p-3" placeholder="Escreva sua opinião..." />
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={salvando} className="rounded-xl bg-[#6A38F3] px-6 py-3 font-semibold text-white disabled:opacity-50">{salvando ? "Salvando..." : editando === null ? "Publicar comentário" : "Salvar alterações"}</button>
                {editando !== null && <button type="button" onClick={cancelarEdicao} className="rounded-xl border border-gray-300 px-5 py-3">Cancelar</button>}
              </div>
            </form>
          </section>
        ) : (
          <div className="rounded-2xl bg-white p-5">Para publicar comentários, <Link href="/login" className="font-semibold text-[#6A38F3] underline">faça login</Link>.</div>
        )}

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Comentários cadastrados</h2>
          {carregando ? <p role="status">Carregando comentários...</p> : comentarios.length === 0 ? <p>Nenhum comentário encontrado.</p> : (
            <div className="space-y-4">
              {comentarios.map(comentario => (
                <article key={comentario.id} className="rounded-3xl bg-white p-6 shadow-sm">
                  <p className="whitespace-pre-wrap break-words">{comentario.conteudo}</p>
                  <p className="mt-2 text-sm text-gray-500">Comentário #{comentario.id} · {comentario.avaliacaoProdutoId != null ? `Avaliação de produto #${comentario.avaliacaoProdutoId}` : `Avaliação de loja #${comentario.avaliacaoLojaId}`}</p>
                  {usuarioId !== null && Number(comentario.usuarioId) === usuarioId && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" disabled={salvando} onClick={() => editar(comentario)} className="rounded-lg border border-[#6A38F3] px-4 py-2 text-sm font-semibold text-[#6A38F3] disabled:opacity-50">Editar</button>
                      <button type="button" disabled={salvando} onClick={() => void excluir(comentario)} className="rounded-lg border border-red-500 px-4 py-2 text-sm font-semibold text-red-600 disabled:opacity-50">Excluir</button>
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
