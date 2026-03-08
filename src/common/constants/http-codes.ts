// src/common/constants/http-status-code.constants.ts

export const HttpStatusCode = {

  // ── 2xx Éxito ──────────────────────────────────────────────
  /** 200 — Solicitud procesada exitosamente */
  OK: 200,

  /** 201 — Recurso creado exitosamente */
  CREATED: 201,

  /** 204 — Exitoso pero sin contenido que retornar */
  NO_CONTENT: 204,

  // ── 4xx Errores del cliente ────────────────────────────────
  /** 400 — Datos enviados inválidos o malformados */
  BAD_REQUEST: 400,

  /** 401 — No autenticado o token inválido/expirado */
  UNAUTHORIZED: 401,

  /** 403 — Autenticado pero sin permisos suficientes para esta acción */
  FORBIDDEN: 403,

  /** 404 — El recurso solicitado no existe */
  NOT_FOUND: 404,

  /** 409 — El recurso ya existe o hay un conflicto de estado */
  CONFLICT: 409,

  // ── 5xx Errores del servidor ───────────────────────────────
  /** 500 — Error inesperado en el servidor */
  INTERNAL_ERROR: 500,

  /** 502 — Error al comunicarse con un servicio externo (Supabase, SMTP, etc.) */
  BAD_GATEWAY: 502,

} as const;