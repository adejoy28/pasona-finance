import { api } from "./client";
import type { CategoryDto } from "./types";

export function listCategories(): Promise<CategoryDto[]> {
  return api.get<CategoryDto[]>("/categories");
}

export function createCategory(input: {
  name: string;
  type: "income" | "expense";
}): Promise<CategoryDto> {
  return api.post<CategoryDto>("/categories", input);
}

export function updateCategory(
  id: number,
  input: Partial<{ name: string; type: "income" | "expense" }>,
): Promise<CategoryDto> {
  return api.put<CategoryDto>(`/categories/${id}`, input);
}

export function deleteCategory(id: number): Promise<void> {
  return api.delete<void>(`/categories/${id}`);
}
