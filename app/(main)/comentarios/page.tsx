"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ModalCriarComentario from "@/app/components/ModalCriarComentario";
import ModalEditarComentario from "@/app/components/ModalEditarComentario";
import ModalEditarAvaliacao from "@/app/components/ModalEditarAvaliacao";
import {
  avaliacoesLojaApi,
  avaliacoesProdutoApi,
  comentariosApi,
  lojasApi,
  produtosApi,
  StockioApiError,
  type AvaliacaoLoja,
  type AvaliacaoProduto,
  type Comentario,
} from "@/lib/stockio-api";
import { clearSession, readSession, SESSION_CHANGED } from "@/lib/session";

type Contexto = { tipo: "loja" | "produto"; id: number };
type Avaliacao = AvaliacaoLoja | AvaliacaoProduto;

const FUNDO = "#F6F3E4";

function idPositivo(valor: string | null): number | null {
  if (!valor?.trim()) return null;
  const id = Number(valor);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function mensagemErro(erro: unknown): string {
  return erro instanceof Error ? erro.message : "Não foi possível concluir a operação.";
}

function tempoRelativo(data: string | undefined, agora: number): string | null {
  if (!data) return null;
  const instante = new Date(data).getTime();
  if (!Number.isFinite(instante)) return null;
  const minutos = Math.max(0, Math.floor((agora - instante) / 60_000));
  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias < 30) return `há ${dias} d`;
  return new Date(data).toLocaleDateString("pt-BR");
}

function Avatar({ nome, url, grande = false }: { nome?: string | null; url?: string | null; grande?: boolean }) {
  const classe = grande
    ? "relative z-10 h-12 w-12 shrink-0 rounded-full object-cover sm:h-[72px] sm:w-[72px]"
    : "relative z-10 h-11 w-11 shrink-0 rounded-full object-cover sm:h-14 sm:w-14";
  const tamanho = grande ? 72 : 56;
  if (url) {
    return <Image src={url} alt={`Foto de ${nome || "usuário"}`} width={tamanho} height={tamanho} unoptimized className={classe} />;
  }
  return <span aria-label={`Avatar de ${nome || "usuário"}`} role="img" className={`${classe} grid place-items-center bg-[#dedbd1] text-lg font-semibold text-black sm:text-xl`}>
    {nome?.trim().charAt(0).toUpperCase() || "?"}
  </span>;
}

function Estrelas({ nota }: { nota: number }) {
  const quantidade = Math.round(Math.max(0, Math.min(5, nota)));
  return <div className="flex items-center gap-0.5 sm:gap-1" role="img" aria-label={`${nota} de 5 estrelas`}>
    {[1, 2, 3, 4, 5].map((indice) => <span key={indice} aria-hidden="true" className={`text-xl leading-none sm:text-[30px] ${indice <= quantidade ? "text-[#FFEB3A]" : "text-white/40"}`}>★</span>)}
  </div>;
}

function IconeLapis() {
  return <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 5 4 4M4 20l4.5-1 10.3-10.3a2.2 2.2 0 0 0-3.1-3.1L5.4 15.9 4 20Z" />
  </svg>;
}

function IconeLixeira() {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7h16M10 4h4m-8 3 .7 13h10.6L18 7M10 11v6m4-6v6" />
  </svg>;
}

function IconeEnviar() {
  return <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21 3-7.7 18-3.1-7.2L3 10.7 21 3ZM10.2 13.8 21 3" />
  </svg>;
}

function ComentariosContent() {
  const params = useSearchParams();
  const router = useRouter();
  const avaliacaoLojaId = idPositivo(params.get("avaliacaoLojaId"));
  const avaliacaoProdutoId = idPositivo(params.get("avaliacaoProdutoId"));
  const contexto: Contexto | null = avaliacaoLojaId && !avaliacaoProdutoId
    ? { tipo: "loja", id: avaliacaoLojaId }
    : avaliacaoProdutoId && !avaliacaoLojaId
      ? { tipo: "produto", id: avaliacaoProdutoId }
      : null;
  const contextoId = contexto?.id;
  const contextoTipo = contexto?.tipo;
  const [avaliacao, setAvaliacao] = useState<Avaliacao | null>(null);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [nomeItem, setNomeItem] = useState("");
  const [proprietarioId, setProprietarioId] = useState<number | null>(null);
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [agora] = useState(() => Date.now());
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [criando, setCriando] = useState(false);
  const [editando, setEditando] = useState<Comentario | null>(null);
  const [editandoAvaliacao, setEditandoAvaliacao] = useState(false);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);
  const [tipoBusca, setTipoBusca] = useState<"loja" | "produto">("loja");
  const [idBusca, setIdBusca] = useState("");
  const [erroBusca, setErroBusca] = useState("");
  const requisicaoAtual = useRef(0);

  const carregar = useCallback(async () => {
    if (!contextoId || !contextoTipo) {
      setCarregando(false);
      return;
    }
    const requisicao = ++requisicaoAtual.current;
    setCarregando(true);
    setErro("");
    setProprietarioId(null);
    try {
      const filtro = contextoTipo === "loja"
        ? { avaliacaoLojaId: contextoId }
        : { avaliacaoProdutoId: contextoId };
      const [avaliacaoObtida, comentariosObtidos] = await Promise.all([
        contextoTipo === "loja" ? avaliacoesLojaApi.buscar(contextoId) : avaliacoesProdutoApi.buscar(contextoId),
        comentariosApi.listar(filtro),
      ]);
      if (requisicao !== requisicaoAtual.current) return;
      setAvaliacao(avaliacaoObtida);
      setComentarios(comentariosObtidos);

      // O título é complementar: se a busca da loja/produto falhar, a avaliação continua disponível.
      const fallback = contextoTipo === "loja"
        ? `Loja #${(avaliacaoObtida as AvaliacaoLoja).lojaId}`
        : `Produto #${(avaliacaoObtida as AvaliacaoProduto).produtoId}`;
      let nome = fallback;
      let donoDaLoja: number | null = null;
      try {
        if (contextoTipo === "loja") {
          const loja = await lojasApi.buscar((avaliacaoObtida as AvaliacaoLoja).lojaId);
          nome = loja.nome;
          donoDaLoja = loja.usuarioId;
        } else {
          const produto = await produtosApi.buscar((avaliacaoObtida as AvaliacaoProduto).produtoId);
          nome = produto.nome;
          // RF47: a loja dona do produto também pode responder à sua avaliação.
          if (produto.loja?.usuarioId !== undefined) {
            donoDaLoja = produto.loja.usuarioId;
          } else if (produto.lojaId) {
            const loja = await lojasApi.buscar(produto.lojaId);
            donoDaLoja = loja.usuarioId;
          }
        }
      } catch {
        // A falta de dados de propriedade não deve impedir a leitura da avaliação.
        // Nunca inferir um proprietário a partir do nome do perfil ou do comentário.
      }
      if (requisicao === requisicaoAtual.current) {
        setNomeItem(nome);
        setProprietarioId(donoDaLoja);
      }
    } catch (error) {
      if (requisicao !== requisicaoAtual.current) return;
      if (error instanceof StockioApiError && error.status === 401) clearSession();
      setAvaliacao(null);
      setComentarios([]);
      setNomeItem("");
      setProprietarioId(null);
      setErro(error instanceof StockioApiError && error.status === 404
        ? "Esta avaliação não existe ou foi removida."
        : mensagemErro(error));
    } finally {
      if (requisicao === requisicaoAtual.current) setCarregando(false);
    }
  }, [contextoId, contextoTipo]);

  useEffect(() => {
    const tarefa = window.setTimeout(() => { void carregar(); }, 0);
    return () => {
      window.clearTimeout(tarefa);
      requisicaoAtual.current += 1;
    };
  }, [carregar]);

  useEffect(() => {
    const atualizar = () => setUsuarioId(readSession()?.userId ?? null);
    atualizar();
    window.addEventListener(SESSION_CHANGED, atualizar);
    window.addEventListener("storage", atualizar);
    return () => {
      window.removeEventListener(SESSION_CHANGED, atualizar);
      window.removeEventListener("storage", atualizar);
    };
  }, []);

  async function excluirComentario(comentario: Comentario) {
    if (excluindoId !== null || !window.confirm("Excluir este comentário?")) return;
    setExcluindoId(comentario.id);
    setAviso("");
    setErro("");
    try {
      await comentariosApi.excluir(comentario.id);
      setComentarios((atuais) => atuais.filter((item) => item.id !== comentario.id));
      setAviso("Comentário excluído com sucesso.");
    } catch (error) {
      if (error instanceof StockioApiError && error.status === 401) clearSession();
      setErro(mensagemErro(error));
    } finally {
      setExcluindoId(null);
    }
  }

  if (!contexto) {
    return <main className="min-h-[75vh] px-5 py-16 sm:py-24" style={{ backgroundColor: FUNDO }}>
      <section className="mx-auto max-w-xl rounded-3xl bg-white p-6 shadow-sm sm:p-10" aria-labelledby="titulo-localizar-avaliacao">
        <h1 id="titulo-localizar-avaliacao" className="text-2xl font-semibold">Localizar uma avaliação</h1>
        <p className="mt-3 text-sm text-gray-600">Selecione o tipo e informe o ID da avaliação, não o ID da loja ou produto.</p>
        <form className="mt-8 space-y-5" onSubmit={(event) => {
          event.preventDefault();
          const id = idPositivo(idBusca);
          if (id === null) { setErroBusca("Informe um ID de avaliação inteiro e positivo."); return; }
          setErroBusca("");
          const parametro = tipoBusca === "loja" ? "avaliacaoLojaId" : "avaliacaoProdutoId";
          router.push("/comentarios?" + parametro + "=" + id);
        }}>
          <label className="block text-sm font-medium">Tipo de avaliação
            <select value={tipoBusca} onChange={(event) => { setTipoBusca(event.target.value as "loja" | "produto"); setErroBusca(""); }} className="mt-2 block w-full rounded-xl border border-gray-300 bg-white px-4 py-3">
              <option value="loja">Loja</option><option value="produto">Produto</option>
            </select>
          </label>
          <label className="block text-sm font-medium">Identificador da avaliação
            <input type="number" min={1} step={1} required value={idBusca} onChange={(event) => { setIdBusca(event.target.value); setErroBusca(""); }} className="mt-2 block w-full rounded-xl border border-gray-300 px-4 py-3" placeholder="Ex.: 2" />
          </label>
          {erroBusca && <p role="alert" className="text-sm text-red-700">{erroBusca}</p>}
          <button type="submit" className="w-full rounded-full bg-[#6A38F3] px-6 py-3 font-medium text-white hover:bg-[#5B2FD1]">Buscar avaliação</button>
        </form>
        <Link href="/lojas" className="mt-6 inline-block text-sm font-medium text-[#6A38F3] hover:underline">Ver lojas</Link>
      </section>
    </main>;
  }

  const hrefVoltar = avaliacao
    ? contexto.tipo === "loja"
      ? `/lojas/${(avaliacao as AvaliacaoLoja).lojaId}`
      : `/produtos/${(avaliacao as AvaliacaoProduto).produtoId}`
    : "/lojas";
  const autor = avaliacao?.usuario;
  const souAutor = avaliacao !== null && usuarioId !== null && avaliacao.usuarioId === usuarioId;

  return <main className="min-h-screen text-[#171717]" style={{ backgroundColor: FUNDO }}>
    <section className="min-h-[330px] bg-black text-white sm:min-h-[395px]" aria-label="Avaliação principal">
      <div className="mx-auto w-full max-w-[1440px] px-5 pb-14 pt-9 sm:px-12 sm:pb-24 sm:pt-14 lg:px-[100px]">
        {carregando ? <div className="pt-10" role="status" aria-live="polite">
          <div className="h-14 w-80 max-w-full animate-pulse rounded-xl bg-white/10" />
          <div className="mt-8 h-6 w-full max-w-2xl animate-pulse rounded bg-white/10" />
          <p className="sr-only">Carregando avaliação...</p>
        </div> : avaliacao ? <article>
          <div className="flex items-start justify-between gap-4 sm:gap-8">
            <div className="flex min-w-0 items-center gap-3 sm:gap-5">
              <Link href={hrefVoltar} aria-label="Voltar à página do item avaliado" className="-ml-1 grid h-10 w-9 shrink-0 place-items-center text-white transition hover:text-[#FFEB3A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-11">
                <span aria-hidden="true" className="text-[36px] font-light leading-none">‹</span>
              </Link>
              <Avatar grande nome={autor?.nome} url={autor?.fotoPerfilUrl} />
              <div className="min-w-0">
                <h1 className="truncate text-[19px] font-medium leading-tight sm:text-[clamp(24px,2.15vw,33px)]">{autor?.nome || autor?.username || "Usuário"}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-white/65 sm:text-[13px]">
                  {autor?.username && <span>@{autor.username}</span>}
                  {tempoRelativo(avaliacao.criadoEm, agora) && <span>{tempoRelativo(avaliacao.criadoEm, agora)}</span>}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1 sm:gap-2">
              {souAutor && <button type="button" aria-label="Editar avaliação" title="Editar avaliação" onClick={() => setEditandoAvaliacao(true)} className="grid h-9 w-9 place-items-center rounded-full text-white/85 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white">
                <IconeLapis />
              </button>}
              <Estrelas nota={avaliacao.nota} />
            </div>
          </div>
          <p className="ml-12 mt-5 max-w-[1100px] whitespace-pre-wrap break-words text-[19px] font-light leading-[1.22] text-white/90 sm:ml-[75px] sm:mt-7 sm:text-[clamp(24px,2.2vw,32px)]">
            {avaliacao.comentario?.trim() || "Esta avaliação não possui texto."}
          </p>
        </article> : <div className="pt-10">
          <Link href="/lojas" className="text-sm text-white/75 hover:text-white">← Voltar às lojas</Link>
          <h1 className="mt-8 text-xl font-semibold">Não foi possível exibir a avaliação</h1>
        </div>}
      </div>
    </section>

    <section className="flex min-h-[500px] flex-col sm:min-h-[525px]" aria-labelledby="titulo-comentarios">
      <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-5 pb-12 pt-6 sm:px-12 sm:pb-[72px] sm:pt-10 lg:px-[100px]">
        <h2 id="titulo-comentarios" className="sr-only">Comentários da avaliação</h2>
        {erro && <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-white/80 px-5 py-4 text-red-800">
          {erro} {!avaliacao && <button type="button" onClick={() => void carregar()} className="ml-2 font-semibold underline">Tentar novamente</button>}
        </div>}
        {aviso && <div role="status" className="mb-6 rounded-xl border border-black/10 bg-white/70 px-5 py-3 text-[#353535]">{aviso}</div>}

        {avaliacao && !carregando && <>
          <div className="relative ml-1 space-y-6 border-l border-[#8D8A81]/65 pl-5 sm:ml-5 sm:space-y-7 sm:pl-12">
            {comentarios.map((comentario) => {
              const proprio = usuarioId !== null && Number(comentario.usuarioId) === usuarioId;
              const donoDaLoja = proprietarioId !== null && Number(comentario.usuarioId) === proprietarioId;
              return <article key={comentario.id} className="group relative flex gap-4 sm:gap-5">
                <Avatar nome={comentario.usuario?.nome} url={comentario.usuario?.fotoPerfilUrl} />
                <div className="min-w-0 flex-1 pt-0.5 sm:pt-1">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <h3 className="text-lg font-medium leading-tight sm:text-[clamp(21px,1.65vw,26px)]">{comentario.usuario?.nome || "Usuário"}</h3>
                        {tempoRelativo(comentario.criadoEm, agora) && <span className="text-[11px] text-black/45 sm:text-xs">{tempoRelativo(comentario.criadoEm, agora)}</span>}
                      </div>
                      {donoDaLoja && <p className="mt-0.5 text-xs font-medium leading-none text-[#653AF2] sm:text-[13px]">dono da loja</p>}
                      {!donoDaLoja && comentario.usuario?.username && <p className="mt-0.5 text-[11px] text-black/45 sm:text-xs">@{comentario.usuario.username}</p>}
                    </div>
                    {proprio && <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                      <button type="button" title="Editar comentário" aria-label="Editar comentário" onClick={() => setEditando(comentario)} className="grid h-9 w-9 place-items-center rounded-full text-black/75 transition hover:bg-black/5 hover:text-black focus-visible:outline-2 focus-visible:outline-black">
                        <IconeLapis />
                      </button>
                      <button type="button" title="Excluir comentário" aria-label="Excluir comentário" disabled={excluindoId !== null} onClick={() => void excluirComentario(comentario)} className="grid h-9 w-9 place-items-center rounded-full text-black/40 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-red-600 disabled:opacity-30">
                        <IconeLixeira />
                      </button>
                    </div>}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-[16px] font-light leading-[1.25] text-[#383832] sm:mt-2 sm:text-[clamp(18px,1.55vw,23px)]">{comentario.conteudo}</p>
                </div>
              </article>;
            })}
          </div>

          {comentarios.length === 0 && <p className="mt-10 text-center text-base text-[#77776b] sm:text-lg">Ainda não há comentários nesta avaliação.</p>}

          {usuarioId !== null && <div className="mt-auto pt-16 sm:pt-20">
            <button type="button" onClick={() => { setErro(""); setAviso(""); setCriando(true); }} className="flex min-h-12 w-full items-center justify-between gap-3 rounded-full bg-white px-5 py-3 text-left text-[16px] text-[#a0a0a0] shadow-sm transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black sm:min-h-[67px] sm:px-8 sm:text-[clamp(17px,1.5vw,21px)]" aria-label="Adicionar comentário">
              <span>Adicionar comentário</span><span className="text-[#8e938b]"><IconeEnviar /></span>
            </button>
          </div>}
        </>}
      </div>
    </section>

    {avaliacao && <>
      <ModalCriarComentario
        isOpen={criando}
        onClose={() => setCriando(false)}
        {...(contexto.tipo === "loja" ? { avaliacaoLojaId: contexto.id } : { avaliacaoProdutoId: contexto.id })}
        onComentarioCriado={(novo) => {
          setComentarios((atuais) => [novo, ...atuais]);
          setAviso("Comentário publicado com sucesso.");
        }}
      />
      {editando && <ModalEditarComentario
        isOpen
        comentario={editando}
        onClose={() => setEditando(null)}
        onComentarioAtualizado={(atualizado) => {
          setComentarios((atuais) => atuais.map((item) => item.id === atualizado.id ? atualizado : item));
          setAviso("Comentário atualizado com sucesso.");
        }}
      />}
      {editandoAvaliacao && <ModalEditarAvaliacao
        isOpen
        tipo={contexto.tipo}
        avaliacao={avaliacao}
        lojaNome={nomeItem}
        onClose={() => setEditandoAvaliacao(false)}
        onAvaliacaoAtualizada={(atualizada) => {
          setAvaliacao(atualizada);
          setAviso("Avaliação atualizada com sucesso.");
        }}
        onAvaliacaoExcluida={() => router.push(hrefVoltar)}
      />}
    </>}
  </main>;
}

export default function ComentariosPage() {
  return <Suspense fallback={<main className="min-h-[75vh] p-10 text-center" style={{ backgroundColor: FUNDO }} role="status">Carregando comentários...</main>}>
    <ComentariosContent />
  </Suspense>;
}
