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
  images?: Array<{ id: number; urlImagem: string; ordem: number }>;
}

export interface Store {
  id: number;
  name: string;
  description?: string;
  logoUrl?: string;
}

export interface Profile {
  id: string;
  name: string;
  username: string;
  email: string;
  avatarUrl?: string;
  stores: Store[];
  products: Product[];
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
  onCreateStore: (data: { name: string; description?: string; logoUrl?: string }) => Promise<Store>;
}
