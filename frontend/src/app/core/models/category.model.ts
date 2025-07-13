export interface Category {
  _id: string;
  name: string;
  code?: string;
  description?: string;
  is_active: boolean;
  parent_category?: string | { _id: string; name: string; code?: string };
  main_category_id?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  code?: string;
  description?: string;
  is_active?: boolean;
  parent_category?: string | null;
  main_category_id?: string | null;
}

export interface UpdateCategoryRequest {
  name?: string;
  code?: string;
  description?: string;
  is_active?: boolean;
  parent_category?: string | null;
  main_category_id?: string | null;
}

export interface CategoryListResponse {
  categories: Category[];
  total: number;
  page: number;
  pages: number;
} 