export interface Category {
  _id: string;
  name: string;
  code?: string;
  description?: string;
  is_active: boolean;
  parent_category?: string | { _id: string; name: string; code?: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  code?: string;
  description?: string;
  is_active?: boolean;
  parent_category?: string | null;
}

export interface UpdateCategoryRequest {
  name?: string;
  code?: string;
  description?: string;
  is_active?: boolean;
  parent_category?: string | null;
}

export interface CategoryListResponse {
  categories: Category[];
  total: number;
  page: number;
  pages: number;
} 