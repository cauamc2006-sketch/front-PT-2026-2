"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { PasswordChange, Profile, ProfileActions, ProfileUpdate } from "./types";
import { Icon } from "./Icons";
import styles from "./profile.module.css";

export function Avatar({ src, name }: { src?: string; name: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return src && !failed ? <img className={styles.avatarImage} src={src} alt={`Foto de ${name}`} onError={() => setFailed(true)} /> : <span className={styles.initials} role="img" aria-label={`Avatar de ${name}`}>{name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "?"}</span>;
}

type View = "edit" | "password" | "delete";
type Props = ProfileActions & { profile: Profile; onClose: () => void; onSaved: (profile: Profile) => void; onNotice: (message: string) => void };

export function ProfileModals({ profile, onClose, onSaved, onNotice, onSave, onChangePassword, onDeleteAccount }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const requestPending = useRef(false);
  const [view, setView] = useState<View>("edit");
  const [name, setName] = useState(profile.name);
  const [username, setUsername] = useState(profile.username);
  const [email, setEmail] = useState(profile.email);
  const [avatarFile, setAvatarFile] = useState<File>();
  const [preview, setPreview] = useState(profile.avatarUrl);
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState("");

  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    element?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = overflow; previousFocus?.focus(); };
  }, []);

  useEffect(() => {
    if (!avatarFile) { setPreview(profile.avatarUrl); return; }
    const url = URL.createObjectURL(avatarFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile, profile.avatarUrl]);

  useEffect(() => { panel.current?.focus(); }, [view]);

  function changeView(nextView: View) {
    setError("");
    setPasswords({ current: "", next: "", confirm: "" });
    setConfirmDelete("");
    setView(nextView);
  }

  function close() { if (!requestPending.current) onClose(); }

  async function run(action: () => Promise<void>) {
    if (requestPending.current) return;
    requestPending.current = true;
    setBusy(true);
    setError("");
    try { await action(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível concluir. Tente novamente."); }
    finally { requestPending.current = false; setBusy(false); }
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const update: ProfileUpdate = { name: name.trim(), username: username.trim().replace(/^@/, ""), email: email.trim(), avatarFile };
    if (!update.name || !update.username || !update.email) { setError("Preencha nome, username e e-mail."); return; }
    if (!/^[A-Za-z0-9._-]{3,30}$/.test(update.username)) { setError("O username deve ter de 3 a 30 caracteres: letras, números, ponto, hífen ou sublinhado."); return; }
    void run(async () => { const saved = await onSave(update); onSaved(saved); onNotice("Perfil atualizado."); onClose(); });
  }

  function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (passwords.next !== passwords.confirm) { setError("A confirmação não coincide com a nova senha."); return; }
    if (passwords.current === passwords.next) { setError("Escolha uma senha diferente da senha antiga."); return; }
    // Mínimo de 8 é uma regra de interface proposta; alinhar com a API do grupo.
    if (passwords.next.length < 8) { setError("Use pelo menos 8 caracteres na nova senha."); return; }
    const data: PasswordChange = { currentPassword: passwords.current, newPassword: passwords.next };
    void run(async () => { await onChangePassword(data); changeView("edit"); onNotice("Senha alterada."); });
  }

  const title = view === "edit" ? "Editar perfil" : view === "password" ? "Alterar senha" : "Excluir conta";
  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="stock-profile-modal-title" onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close(); } }}>
    <div ref={panel} tabIndex={-1} className={styles.modalPanel} aria-busy={busy}>
      <h2 id="stock-profile-modal-title" className={styles.srOnly}>{title}</h2>
      <button type="button" className={`${styles.iconButton} ${styles.closeButton}`} aria-label="Fechar" onClick={close} disabled={busy}><Icon name="close" /></button>
      {view !== "edit" && <button type="button" className={`${styles.iconButton} ${styles.backButton}`} aria-label="Voltar para editar perfil" onClick={() => changeView("edit")} disabled={busy}><Icon name="back" /></button>}
      {view === "edit" && <form onSubmit={saveProfile} className={styles.modalForm}>
        <fieldset disabled={busy} className={styles.fieldset}>
          <div className={styles.photoPicker}>
            <div className={styles.modalAvatar}><Avatar src={preview} name={name || profile.name} /></div>
            <button type="button" className={styles.cameraButton} aria-label="Alterar foto do perfil" onClick={() => fileInput.current?.click()}><Icon name="camera" /></button>
            <input ref={fileInput} className={styles.srOnly} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Selecionar nova foto" onChange={event => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setError("Selecione uma imagem JPG, PNG ou WebP."); return; }
              if (file.size > 5 * 1024 * 1024) { setError("A foto deve ter até 5 MB."); return; }
              setError(""); setAvatarFile(file);
            }} />
          </div>
          <div className={styles.fields}>
            <label><span className={styles.srOnly}>Nome</span><input name="name" placeholder="Nome" autoComplete="name" required maxLength={100} value={name} onChange={event => setName(event.target.value)} /></label>
            <label><span className={styles.srOnly}>Username</span><input name="username" placeholder="Username" autoComplete="username" required maxLength={31} value={username} onChange={event => setUsername(event.target.value)} /></label>
            <label><span className={styles.srOnly}>E-mail</span><input name="email" placeholder="Email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} /></label>
          </div>
          <div className={styles.modalActions}>
            <button type="button" className={styles.dangerOutline} onClick={() => changeView("delete")}>Deletar conta</button>
            <button type="button" className={styles.outline} onClick={() => changeView("password")}>Alterar senha</button>
            <button type="submit" className={styles.primary}>{busy ? "Salvando…" : "Salvar"}</button>
          </div>
        </fieldset>
      </form>}
      {view === "password" && <form onSubmit={savePassword} className={styles.modalForm}>
        <fieldset disabled={busy} className={styles.fieldset}>
          <div className={styles.keyIllustration}><Icon name="key" width={120} height={120} /></div>
          <div className={styles.fields}>
            <label><span className={styles.srOnly}>Senha antiga</span><input name="currentPassword" placeholder="Senha Antiga" type="password" autoComplete="current-password" required value={passwords.current} onChange={event => setPasswords({ ...passwords, current: event.target.value })} /></label>
            <label><span className={styles.srOnly}>Nova senha</span><input name="newPassword" placeholder="Nova Senha" type="password" autoComplete="new-password" minLength={8} required value={passwords.next} onChange={event => setPasswords({ ...passwords, next: event.target.value })} /></label>
            <label><span className={styles.srOnly}>Confirmar senha</span><input name="confirmPassword" placeholder="Confirmar Senha" type="password" autoComplete="new-password" minLength={8} required value={passwords.confirm} onChange={event => setPasswords({ ...passwords, confirm: event.target.value })} /></label>
          </div>
          <div className={styles.modalActions}><button type="submit" className={styles.primary}>{busy ? "Salvando…" : "Salvar Senha"}</button></div>
        </fieldset>
      </form>}
      {view === "delete" && <form className={styles.deleteForm} onSubmit={event => { event.preventDefault(); if (confirmDelete !== "EXCLUIR") return; void run(async () => { await onDeleteAccount(); onNotice("Conta excluída."); onClose(); }); }}>
        <h3>Excluir conta?</h3>
        <p>Essa ação é permanente. Digite <strong>EXCLUIR</strong> para confirmar.</p>
        <fieldset disabled={busy} className={styles.fieldset}>
          <label className={styles.fields}>Confirmação<input autoComplete="off" name="confirmation" value={confirmDelete} onChange={event => setConfirmDelete(event.target.value)} required /></label>
          <div className={styles.modalActions}><button className={styles.danger} type="submit" disabled={confirmDelete !== "EXCLUIR"}>{busy ? "Excluindo…" : "Excluir minha conta"}</button><button className={styles.outline} type="button" onClick={() => changeView("edit")}>Cancelar</button></div>
        </fieldset>
      </form>}
      {error && <p role="alert" className={styles.error}>{error}</p>}
    </div>
  </dialog>;
}
