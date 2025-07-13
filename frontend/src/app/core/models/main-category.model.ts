export interface MainCategory {
  _id?: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  is_active?: boolean;
  sort_order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MainCategoryFormData {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  is_active?: boolean;
  sort_order?: number;
} 