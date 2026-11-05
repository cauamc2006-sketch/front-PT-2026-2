export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  imageAlt?: string;
  href?: string;
}

export interface Profile {
  id: string;
  name: string;
  username: string;
  email: string;
  avatarUrl?: string;
}

export interface ProfileUpdate {
  name: string;
  username: string;
  email: string;
  avatarFile?: File;
}

export interface PasswordChange {
  currentPassword: string;
  newPassword: string;
}

/** Callbacks devem rejeitar a Promise quando a API falhar. */
export interface ProfileActions {
  onSave: (data: ProfileUpdate) => Promise<Profile>;
  onChangePassword: (data: PasswordChange) => Promise<void>;
  onDeleteAccount: () => Promise<void>;
}
