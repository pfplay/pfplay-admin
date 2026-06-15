import { http } from "@/shared/api/http"
import { unwrap } from "@/shared/api/page"
import type { ApiCommonResponse } from "@/shared/api/page"
import type { PersonaListItem, Persona } from "@/entities/virtual-dj"
import type {
  CreatePersonaRequest,
  UpdatePersonaRequest,
} from "../model/persona-schema"

const API = "/api/v1/admin/virtual-dj/personas"

interface CreatedIdResponse {
  id: number
}

export async function listPersonas(): Promise<PersonaListItem[]> {
  const res = await http<ApiCommonResponse<PersonaListItem[]>>(API)
  return unwrap(res)
}

export async function getPersona(id: number): Promise<Persona> {
  const res = await http<ApiCommonResponse<Persona>>(`${API}/${id}`)
  return unwrap(res)
}

export async function createPersona(
  body: CreatePersonaRequest,
): Promise<number> {
  const res = await http<ApiCommonResponse<CreatedIdResponse>>(API, {
    method: "POST",
    body,
  })
  return unwrap(res).id
}

export async function updatePersona(
  id: number,
  body: UpdatePersonaRequest,
): Promise<void> {
  await http<void>(`${API}/${id}`, { method: "PUT", body })
}

export async function deletePersona(id: number): Promise<void> {
  await http<void>(`${API}/${id}`, { method: "DELETE" })
}
