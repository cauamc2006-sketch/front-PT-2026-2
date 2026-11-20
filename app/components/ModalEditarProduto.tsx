"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { productImagesApi, uploadProductImages } from "@/lib/products";
import { categoriasApi, produtosApi, type Categoria, type Product } from "@/lib/stockio-api";

const TIPOS_IMAGEM = ["image/jpeg", "image/png", "image/webp"];
const ESTOQUE_MAXIMO = 2147483647;
const campo = "w-full rounded-full bg-white px-6 py-3 font-sans text-base text-black shadow-sm focus-visible:outline-2 focus-visible:outline-brand";

type Props = {
  produto: Product;
  onClose: () => void;
  onUpdate: (produto: Product) => void;
  onSave: () => void;
  onDelete: () => void;
};

type Selecao = { arquivo: File; previa: string };

export function ModalEditarProduto({ produto, onClose, onUpdate, onSave, onDelete }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const arquivos = useRef(new Map<number, Selecao>());
  const operacao = useRef(false);
  const [previas, setPrevias] = useState<Record<number, string>>({});
  const [categorias, setCategorias] = useState<Categoria[]>();
  const [erroCategorias, setErroCategorias] = useState(false);
  const [categoriaId, setCategoriaId] = useState(produto.categoriaId?.toString() ?? "");
  const [estoque, setEstoque] = useState(produto.estoque);
  const [ocupado, setOcupado] = useState<"salvar" | "excluir">();
  const [erro, setErro] = useState("");

  const imagens = [...(produto.imagens ?? [])].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

  useEffect(() => {
    const element = dialog.current;
    const selecoes = arquivos.current;
    let ativo = true;
    element?.showModal();

    categoriasApi.listar().then(lista => {
      if (ativo) setCategorias(lista);
    }).catch(() => {
      if (ativo) setErroCategorias(true);
    });

    return () => {
      ativo = false;
      element?.close();
      selecoes.forEach(selecao => URL.revokeObjectURL(selecao.previa));
      selecoes.clear();
    };
  }, []);

  function limparSelecao(indice: number) {
    const selecao = arquivos.current.get(indice);
    if (selecao) URL.revokeObjectURL(selecao.previa);
    arquivos.current.delete(indice);
    setPrevias(atuais => {
      const proximas = { ...atuais };
      delete proximas[indice];
      return proximas;
    });
  }

  function selecionar(indice: number, arquivo?: File) {
    if (!arquivo) return;
    if (!TIPOS_IMAGEM.includes(arquivo.type) || arquivo.size > 5 * 1024 * 1024) {
      setErro("Use imagens JPG, PNG ou WebP de até 5 MB.");
      return;
    }

    limparSelecao(indice);
    const previa = URL.createObjectURL(arquivo);
    arquivos.current.set(indice, { arquivo, previa });
    setPrevias(atuais => ({ ...atuais, [indice]: previa }));
    setErro("");
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (operacao.current) return;
    const data = new FormData(event.currentTarget);
    const nome = String(data.get("nome") ?? "").trim();
    const descricao = String(data.get("descricao") ?? "").trim();
    const categoria = String(data.get("categoriaId") ?? "");
    const valor = String(data.get("preco") ?? "").trim();
    const preco = Number(valor.replace(",", "."));

    if (!nome) { setErro("Informe o nome do produto."); return; }
    if (!/^\d+(?:[.,]\d{1,2})?$/.test(valor) || preco > 99999999.99) {
      setErro("Informe um preço válido com até duas casas decimais.");
      return;
    }

    operacao.current = true;
    setOcupado("salvar");
    setErro("");
    let dadosSalvos = false;

    try {
      let atualizado = await produtosApi.atualizar(produto.id, {
        nome, descricao, preco, estoque, ...(categoria ? { categoriaId: Number(categoria) } : {}),
      });
      dadosSalvos = true;
      onUpdate(atualizado);

      const pendentes = [...arquivos.current].sort(([a], [b]) => a - b);
      if (pendentes.length) {
        const urls = await uploadProductImages(pendentes.map(([, selecao]) => selecao.arquivo));
        if (urls.length !== pendentes.length || urls.some(url => !url)) {
          throw new Error("O servidor não retornou todas as fotos enviadas.");
        }

        const novas: Array<{ indice: number; url: string }> = [];
        for (const [posicao, [indice]] of pendentes.entries()) {
          const imagem = imagens[indice];
          const url = urls[posicao];
          if (!imagem) {
            novas.push({ indice, url });
            continue;
          }
          if (imagem.id === undefined) throw new Error("Não foi possível identificar a foto a substituir.");
          const substituida = await productImagesApi.replace(produto.id, imagem.id, url);
          atualizado = { ...atualizado, imagens: (atualizado.imagens ?? []).map(item => item.id === substituida.id ? substituida : item) };
          onUpdate(atualizado);
          limparSelecao(indice);
        }
        if (novas.length) {
          const galeria = await productImagesApi.add(produto.id, novas.map(item => item.url));
          onUpdate({ ...atualizado, imagens: galeria });
          novas.forEach(item => limparSelecao(item.indice));
        }
      }
      onSave();
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : "Não foi possível salvar o produto.";
      setErro(dadosSalvos ? `Dados salvos. Falha ao atualizar as fotos. ${mensagem}` : mensagem);
    } finally {
      operacao.current = false;
      setOcupado(undefined);
    }
  }

  async function excluir() {
    if (operacao.current || !window.confirm(`Excluir "${produto.nome}"? Essa ação é permanente.`)) return;
    operacao.current = true;
    setOcupado("excluir");
    setErro("");
    try {
      await produtosApi.excluir(produto.id);
      onDelete();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível excluir o produto.");
      operacao.current = false;
      setOcupado(undefined);
    }
  }

  return (
    <dialog ref={dialog} aria-labelledby="editar-produto-titulo"
      onCancel={event => { event.preventDefault(); if (!operacao.current) onClose(); }}
      className="m-auto max-h-[92dvh] w-[calc(100%-2rem)] max-w-[600px] overflow-y-auto rounded-[32px] bg-[#eee] p-5 font-sans text-ink shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm sm:p-8">
      <button type="button" aria-label="Fechar" disabled={!!ocupado} onClick={onClose}
        className="absolute top-3 right-3 grid size-11 place-items-center text-4xl leading-none font-light hover:text-brand focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50 sm:top-5 sm:right-5">
        <span aria-hidden="true">×</span>
      </button>
      <h2 id="editar-produto-titulo" className="mt-2 mb-5 px-9 text-center text-3xl leading-tight font-medium sm:mb-7">Editar Produto</h2>
      <form onSubmit={salvar}>
        <fieldset disabled={!!ocupado} aria-busy={!!ocupado} className="grid min-w-0 gap-3">
          <div className="mb-2 grid grid-cols-3 gap-3 sm:gap-4" role="group" aria-label="Fotos do produto">
            {Array.from({ length: 4 }, (_, indice) => {
              const principal = indice === 0;
              const src = previas[indice] ?? imagens[indice]?.urlImagem;
              return (
                <div key={indice} className={`relative min-w-0 ${principal ? "col-span-3" : ""}`}>
                  <label className={`relative block w-full cursor-pointer overflow-hidden rounded-2xl transition-opacity hover:opacity-85 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand ${principal ? "aspect-[828/179]" : "aspect-[230/151]"}`}>
                    {src ? (
                      <Image src={src} alt="" fill unoptimized
                        sizes={principal ? "(max-width: 640px) 90vw, 536px" : "(max-width: 640px) 30vw, 168px"}
                        className="rounded-2xl border border-dashed border-brand bg-white object-contain" />
                    ) : (
                      <Image src={principal ? "/Modais/anexar_grande.svg" : "/Modais/anexar_pequeno.svg"}
                        alt="" width={principal ? 828 : 230} height={principal ? 179 : 151}
                        className="h-auto w-full" />
                    )}
                    <input type="file" className="sr-only" accept={TIPOS_IMAGEM.join(",")}
                      aria-label={`${src ? "Substituir" : "Anexar"} ${principal ? "foto principal" : `foto ${indice + 1}`}`}
                      onChange={event => { selecionar(indice, event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} />
                  </label>
                  {previas[indice] && <button type="button" aria-label={`Desfazer seleção da foto ${indice + 1}`}
                    onClick={() => limparSelecao(indice)} className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-black/75 text-xl text-white">×</button>}
                </div>
              );
            })}
          </div>

          <input aria-label="Nome do produto" name="nome" className={campo} required maxLength={255} defaultValue={produto.nome} />
          <select aria-label="Categoria" name="categoriaId" className={`${campo} font-light`} value={categoriaId} onChange={event => setCategoriaId(event.target.value)} disabled={!categorias}>
            {!produto.categoriaId && <option value="">Selecione a categoria</option>}
            {produto.categoriaId && !categorias?.some(item => item.id === produto.categoriaId) &&
              <option value={produto.categoriaId}>{produto.categoria?.nome || "Categoria atual"}</option>}
            {categorias?.map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}
          </select>
          {erroCategorias && <p role="status" className="text-xs text-red-700">Não foi possível carregar as categorias.</p>}
          <textarea aria-label="Descrição" name="descricao" className={`${campo} min-h-24 resize-y rounded-[24px] py-4`} rows={2} defaultValue={produto.descricao ?? ""} />
          <label className={`${campo} flex items-center gap-1`}>
            <span aria-hidden="true">R$</span>
            <input aria-label="Preço em reais" name="preco" inputMode="decimal" required
              className="min-w-0 flex-1 font-sans outline-none focus-visible:underline" defaultValue={Number(produto.preco).toFixed(2).replace(".", ",")} />
          </label>
          <button type="button" onClick={() => void excluir()} className="rounded-full bg-[#ed2800] py-3 text-lg font-medium text-white hover:bg-[#cd2300]">
            {ocupado === "excluir" ? "EXCLUINDO…" : "DELETAR"}
          </button>
          <div role="group" aria-label="Estoque" className="my-4 flex items-center justify-center gap-8 text-brand sm:gap-12">
            <button type="button" aria-label="Diminuir estoque" disabled={estoque <= 0}
              onClick={() => setEstoque(valor => Math.max(0, valor - 1))}
              className="grid size-12 place-items-center rounded-full border border-brand text-4xl leading-none hover:bg-brand hover:text-white disabled:opacity-40 font-light">−</button>
            <input type="number" aria-label="Quantidade em estoque" min={0} max={ESTOQUE_MAXIMO} step={1} required
              className="w-16 appearance-none bg-transparent text-center font-sans text-5xl font-medium [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              value={estoque} onChange={event => setEstoque(event.currentTarget.valueAsNumber || 0)} />
            <button type="button" aria-label="Aumentar estoque" disabled={estoque >= ESTOQUE_MAXIMO}
              onClick={() => setEstoque(valor => Math.min(ESTOQUE_MAXIMO, valor + 1))}
              className="grid size-12 place-items-center rounded-full border border-brand text-4xl leading-none hover:bg-brand hover:text-white disabled:opacity-40 font-light">+</button>
          </div>
          {erro && <p role="alert" className="text-center text-sm text-red-700">{erro}</p>}
          <button type="submit" className="mx-auto w-full max-w-[240px] rounded-full bg-brand px-6 py-3 text-lg font-medium text-white shadow-md hover:bg-brand/85 disabled:opacity-70">
            {ocupado === "salvar" ? "Salvando…" : "Salvar"}
          </button>
        </fieldset>
      </form>
    </dialog>
  );
}
