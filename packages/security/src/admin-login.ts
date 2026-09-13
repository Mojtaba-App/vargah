/** حداکثر تلاش ناموفق ورود با رمز عبور قبل از قفل موقت */
export const ADMIN_LOGIN_FAIL_LIMIT = 3;

/** مدت قفل پس از رسیدن به سقف تلاش (۱۵ دقیقه) */
export const ADMIN_LOGIN_LOCKOUT_MS = 15 * 60 * 1000;

/** اعتبار چالش ورود (بین رمز و OTP) */
export const ADMIN_LOGIN_CHALLENGE_MS = 5 * 60 * 1000;
