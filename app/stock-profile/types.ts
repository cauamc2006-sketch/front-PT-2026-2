export interface ImageRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  sourceWidth: number;
  sourceHeight: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  imageAlt?: string;
  href?: string;
  storeLogoUrl?: string;
  storeName?: string;
  available?: boolean;
  imageRegion?: ImageRegion;
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
