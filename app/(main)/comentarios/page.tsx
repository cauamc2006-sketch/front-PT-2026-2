"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import ModalCriarComentario from "@/app/components/ModalCriarComentario";
import ModalEditarAvaliacao from "@/app/components/ModalEditarAvaliacao";
import ModalEditarComentario from "@/app/components/ModalEditarComentario";
import {
  avaliacoesLojaApi,
  avaliacoesProdutoApi,
  comentariosApi,
  StockioApiError,
  type AvaliacaoLoja,
  type AvaliacaoProduto,
  type Comentario,
} from "@/lib/stockio-api";
import { clearSession, readSession, SESSION_CHANGED } from "@/lib/session";

type Contexto = { tipo: "loja" | "produto"; id: number };
type Avaliacao = AvaliacaoLoja | AvaliacaoProduto;

function idPositivo(valor: string | null): number | null {
  const numero = Number(valor);
  return valor && Number.isSafeInteger(numero) && numero > 0 ? numero : null;
}

function mensagemErro(erro: unknown) {
  return erro instanceof Error ? erro.message : "Não foi possível carregar esta conversa.";
}

function Avatar({ nome, url, tamanho = 48 }: { nome?: string | null; url?: string | null; tamanho?: number }) {
  if (url) {
    return <Image src={url} alt={`Foto de ${nome || "usuário"}`} width={tamanho} height={tamanho} unoptimized className="shrink-0 rounded-full object-cover" style={{ width: tamanho, height: tamanho }} />;
  }
  return <span aria-hidden="true" className="grid shrink-0 place-items-center rounded-full bg-[#b7ee00] font-bold text-black" style={{ width: tamanho, height: tamanho }}>{nome?.trim().charAt(0).toUpperCase() || "?"}</span>;
}

function Estrelas({ nota }: { nota: number }) {
  return <span className="flex gap-1 text-xl" aria-label={`${nota} de 5 estrelas`}>
    {[1, 2, 3, 4, 5].map((valor) => <span key={valor} aria-hidden="true" className={valor <= nota ? "text-[#b7ee00]" : "text-white/25"}>★</span>)}
  </span>;
}

function ComentariosContent() {
  const params = useSearchParams();
  const router = useRouter();
  const lojaId = idPositivo(params.get("avaliacaoLojaId"));
  const produtoId = idPositivo(params.get("avaliacaoProdutoId"));
  const contexto: Contexto | null = lojaId && !produtoId ? { tipo: "loja", id: lojaId } : produtoId && !lojaId ? { tipo: "produto", id: produtoId } : null;
  const contextoId = contexto?.id;
  const contextoTipo = contexto?.tipo;
  const [avaliacao, setAvaliacao] = useState<Avaliacao | null>(null);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [criando, setCriando] = useState(false);
  const [editando, setEditando] = useState<Comentario | null>(null);
  const [editandoAvaliacao, setEditandoAvaliacao] = useState(false);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    if (!contextoId || !contextoTipo) { setCarregando(false); return; }
    setCarregando(true);
    setErro("");
    try {
      const filtro = contextoTipo === "loja" ? { avaliacaoLojaId: contextoId } : { avaliacaoProdutoId: contextoId };
      const [avaliacaoData, comentariosData] = await Promise.all([
        contextoTipo === "loja" ? avaliacoesLojaApi.buscar(contextoId) : avaliacoesProdutoApi.buscar(contextoId),
        comentariosApi.listar(filtro),
      ]);
      setAvaliacao(avaliacaoData);
      setComentarios(comentariosData);
    } catch (error) {
      if (error instanceof StockioApiError && error.status === 401) clearSession();
      setAvaliacao(null);
      setComentarios([]);
      setErro(error instanceof StockioApiError && error.status === 404 ? "Esta avaliação não existe ou foi removida." : mensagemErro(error));
    } finally {
      setCarregando(false);
    }
  }, [contextoId, contextoTipo]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void carregar(); }, 0);
    return () => window.clearTimeout(timer);
  }, [carregar]);
  useEffect(() => {
    const atualizar = () => setUsuarioId(readSession()?.userId ?? null);
    atualizar();
    window.addEventListener(SESSION_CHANGED, atualizar);
    window.addEventListener("storage", atualizar);
    return () => { window.removeEventListener(SESSION_CHANGED, atualizar); window.removeEventListener("storage", atualizar); };
  }, []);

  async function excluirComentario(comentario: Comentario) {
    if (!window.confirm("Excluir este comentário?")) return;
    setExcluindoId(comentario.id); setErro(""); setAviso("");
    try {
      await comentariosApi.excluir(comentario.id);
      setComentarios((atuais) => atuais.filter((item) => item.id !== comentario.id));
      setAviso("Comentário excluído com sucesso.");
    } catch (error) { setErro(mensagemErro(error)); }
    finally { setExcluindoId(null); }
  }

  if (!contexto) return <main className="min-h-[70vh] bg-[#f7f1e1] px-5 py-20"><div className="mx-auto max-w-xl rounded-[32px] bg-white p-10 text-center shadow-sm"><p className="text-5xl">?</p><h1 className="mt-5 text-2xl font-bold">Avaliação não informada</h1><p className="mt-3 text-gray-600">Abra esta página pelo link de comentários de uma avaliação de loja ou produto.</p><Link href="/lojas" className="mt-7 inline-flex rounded-full bg-[#5a3cf0] px-6 py-3 font-semibold text-white">Explorar lojas</Link></div></main>;
  if (carregando) return <main role="status" className="min-h-[70vh] bg-[#f7f1e1] px-5 py-24 text-center"><span className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[#5a3cf0]/20 border-t-[#5a3cf0]" /><p className="mt-4">Carregando avaliação e comentários...</p></main>;

  const autor = avaliacao?.usuario;
  const souAutor = Boolean(avaliacao && usuarioId === avaliacao.usuarioId);
  const tituloContexto = contexto.tipo === "loja" ? "Avaliação de loja" : "Avaliação de produto";

  return <main className="min-h-screen bg-[#f7f1e1] text-[#181a19]">
    <header className="bg-[#111311] px-5 pb-14 pt-8 text-white sm:pb-20 sm:pt-10"><div className="mx-auto max-w-5xl">
      <button type="button" onClick={() => router.back()} className="rounded-full border border-white/20 px-4 py-2 text-sm transition hover:border-white/50">← Voltar</button>
      {avaliacao && <article className="mt-10 max-w-3xl"><div className="flex flex-wrap items-center justify-between gap-4"><p className="text-xs font-bold uppercase tracking-[.22em] text-[#b7ee00]">{tituloContexto} #{avaliacao.id}</p>{souAutor && contexto.tipo === "loja" && <button type="button" onClick={() => setEditandoAvaliacao(true)} className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold hover:bg-white hover:text-black">Editar avaliação</button>}</div>
        <div className="mt-7 flex items-center gap-4"><Avatar nome={autor?.nome} url={autor?.fotoPerfilUrl} tamanho={56} /><div><p className="text-lg font-bold">{autor?.nome || "Usuário"}</p>{autor?.username && <p className="text-sm text-white/55">@{autor.username}</p>}</div></div><div className="mt-6"><Estrelas nota={avaliacao.nota} /></div><p className="mt-4 whitespace-pre-wrap break-words text-xl leading-relaxed text-white/90 sm:text-2xl">{avaliacao.comentario?.trim() || "Esta avaliação não possui texto."}</p></article>}
    </div></header>

    <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
      {erro && <div role="alert" className="mb-7 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">{erro} {!avaliacao && <button type="button" onClick={() => void carregar()} className="ml-2 font-bold underline">Tentar novamente</button>}</div>}
      {aviso && <div role="status" className="mb-7 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">{aviso}</div>}
      {avaliacao && <section aria-labelledby="titulo-comentarios"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#5a3cf0]">Comunidade</p><h1 id="titulo-comentarios" className="mt-2 text-3xl font-bold">Comentários <span className="text-lg font-medium text-gray-500">({comentarios.length})</span></h1></div>{usuarioId !== null && <button type="button" onClick={() => { setAviso(""); setCriando(true); }} className="rounded-full bg-[#5a3cf0] px-6 py-3 font-bold text-white shadow-lg shadow-[#5a3cf0]/20 transition hover:-translate-y-0.5">+ Adicionar comentário</button>}</div>
        {comentarios.length === 0 ? <div className="mt-7 rounded-[28px] border border-dashed border-black/20 bg-white/50 px-6 py-12 text-center"><p className="text-lg font-bold">Ainda não há comentários</p><p className="mt-2 text-gray-600">Seja a primeira pessoa a participar desta conversa.</p></div> : <div className="mt-7 grid gap-4">{comentarios.map((comentario) => { const proprio = usuarioId === Number(comentario.usuarioId); return <article key={comentario.id} className="rounded-[28px] bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,.04)] sm:p-7"><div className="flex gap-4"><Avatar nome={comentario.usuario?.nome} url={comentario.usuario?.fotoPerfilUrl} /><div className="min-w-0 flex-1"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-bold">{comentario.usuario?.nome || "Usuário"}</p>{comentario.usuario?.username && <p className="text-sm text-gray-500">@{comentario.usuario.username}</p>}</div>{proprio && <div className="flex gap-2"><button type="button" onClick={() => setEditando(comentario)} className="rounded-full px-3 py-1 text-sm font-semibold text-[#5a3cf0] hover:bg-[#5a3cf0]/10">Editar</button><button type="button" disabled={excluindoId === comentario.id} onClick={() => void excluirComentario(comentario)} className="rounded-full px-3 py-1 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">{excluindoId === comentario.id ? "Excluindo..." : "Excluir"}</button></div>}</div><p className="mt-4 whitespace-pre-wrap break-words leading-7 text-gray-700">{comentario.conteudo}</p></div></div></article>; })}</div>}
        {usuarioId === null && <div className="mt-7 rounded-[24px] bg-black px-6 py-5 text-center text-white">Quer participar? <Link href="/login" className="font-bold text-[#b7ee00] underline">Entre na sua conta</Link>.</div>}
      </section>}
    </div>

    <ModalCriarComentario isOpen={criando} onClose={() => setCriando(false)} {...(contexto.tipo === "loja" ? { avaliacaoLojaId: contexto.id } : { avaliacaoProdutoId: contexto.id })} onComentarioCriado={(novo) => { setComentarios((atuais) => [novo, ...atuais]); setAviso("Comentário publicado com sucesso."); }} />
    {editando && <ModalEditarComentario isOpen comentario={editando} onClose={() => setEditando(null)} onComentarioAtualizado={(atualizado) => { setComentarios((atuais) => atuais.map((item) => item.id === atualizado.id ? atualizado : item)); setAviso("Comentário atualizado com sucesso."); }} />}
    {contexto.tipo === "loja" && editandoAvaliacao && <ModalEditarAvaliacao isOpen onClose={() => setEditandoAvaliacao(false)} avaliacao={avaliacao as AvaliacaoLoja | null} lojaNome="esta loja" onAvaliacaoAtualizada={(atualizada) => { setAvaliacao(atualizada); setAviso("Avaliação atualizada com sucesso."); }} onAvaliacaoExcluida={() => router.push("/lojas")} />}
  </main>;
}

export default function ComentariosPage() {
  return <Suspense fallback={<main className="min-h-[70vh] bg-[#f7f1e1] p-12 text-center" role="status">Carregando...</main>}><ComentariosContent /></Suspense>;
}
