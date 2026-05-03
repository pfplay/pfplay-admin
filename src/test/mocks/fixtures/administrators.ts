import type {
  AdministratorView,
  AdministratorListResponse,
} from "@/entities/administrator"

export const superAdminFixture: AdministratorView = {
  administratorId: 1,
  role: "SUPER_ADMIN",
  grantedAt: "2026-01-01T00:00:00",
  grantedByAdministratorId: null,
  revokedAt: null,
  userAccountId: 1,
  email: "super@pfplay.local",
  lastLoginAt: "2026-05-03T00:00:00",
  mustChangePassword: false,
  memberId: 1,
  nickname: "수퍼관리자",
}

export const adminActiveFixture: AdministratorView = {
  administratorId: 2,
  role: "ADMIN",
  grantedAt: "2026-04-01T00:00:00",
  grantedByAdministratorId: 1,
  revokedAt: null,
  userAccountId: 2,
  email: "admin1@pfplay.local",
  lastLoginAt: "2026-05-02T15:00:00",
  mustChangePassword: false,
  memberId: 2,
  nickname: "운영자A",
}

export const adminMustChangePasswordFixture: AdministratorView = {
  administratorId: 3,
  role: "ADMIN",
  grantedAt: "2026-05-03T09:00:00",
  grantedByAdministratorId: 1,
  revokedAt: null,
  userAccountId: 3,
  email: "admin2@pfplay.local",
  lastLoginAt: null,
  mustChangePassword: true,
  memberId: 3,
  nickname: "신규운영자",
}

export const adminRevokedFixture: AdministratorView = {
  administratorId: 4,
  role: "ADMIN",
  grantedAt: "2026-02-01T00:00:00",
  grantedByAdministratorId: 1,
  revokedAt: "2026-04-15T12:00:00",
  userAccountId: 4,
  email: "former@pfplay.local",
  lastLoginAt: "2026-04-14T18:00:00",
  mustChangePassword: false,
  memberId: 4,
  nickname: "전직운영자",
}

export const adminWithoutMemberFixture: AdministratorView = {
  administratorId: 5,
  role: "ADMIN",
  grantedAt: "2026-05-01T00:00:00",
  grantedByAdministratorId: 1,
  revokedAt: null,
  userAccountId: 5,
  email: "noprofile@pfplay.local",
  lastLoginAt: null,
  mustChangePassword: true,
  memberId: null,
  nickname: null,
}

export const administratorListFixture: AdministratorListResponse = {
  totalCount: 4,
  // default 동작은 includeRevoked=false라 4건 (revoked 제외)
  items: [
    superAdminFixture,
    adminActiveFixture,
    adminMustChangePasswordFixture,
    adminWithoutMemberFixture,
  ],
}

export const administratorListIncludeRevokedFixture: AdministratorListResponse = {
  totalCount: 5,
  items: [
    superAdminFixture,
    adminActiveFixture,
    adminMustChangePasswordFixture,
    adminWithoutMemberFixture,
    adminRevokedFixture,
  ],
}

export const createAdministratorResponseFixture = {
  administratorId: 99,
  userAccountId: 199,
  memberId: 199,
  tempPassword: "TempP@ss-abc123",
  message: "어드민이 생성되었습니다. 임시 비밀번호를 안전하게 전달하고 즉시 변경하도록 안내하세요.",
}

export const resetPasswordResponseFixture = {
  tempPassword: "TempP@ss-xyz789",
  message: "비밀번호가 리셋되었습니다.",
}

export const adminMgtNotFoundError = {
  status: 404,
  errorCode: "ADM_MGT_001",
  message: "어드민을 찾을 수 없습니다.",
}

export const adminMgtEmailRegisteredError = {
  status: 409,
  errorCode: "ADM_MGT_002",
  message: "이미 등록된 이메일입니다.",
}

export const adminMgtCannotRevokeLastSuperAdminError = {
  status: 409,
  errorCode: "ADM_MGT_003",
  message: "마지막 슈퍼어드민은 회수할 수 없습니다.",
}

export const adminMgtCannotRevokeSelfError = {
  status: 409,
  errorCode: "ADM_MGT_004",
  message: "본인 권한은 회수할 수 없습니다.",
}

export const adminMgtMemberProfileRequiredError = {
  status: 409,
  errorCode: "ADM_MGT_005",
  message: "멤버 프로필이 먼저 연결되어야 합니다.",
}
