import { supabase } from "@/lib/supabase";

export async function getMfaState() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      authenticated: false,
      required: false,
      hasVerifiedFactor: false,
      currentLevel: null,
      nextLevel: null,
    };
  }

  const [
    securityResult,
    factorResult,
    aalResult,
  ] = await Promise.all([
    supabase
      .from("account_security")
      .select("mfa_required")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.auth.mfa.listFactors(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);

  const required =
    securityResult.data?.mfa_required === true;

  const verifiedTotp =
    factorResult.data?.totp?.find(
      (factor) =>
        factor.status === "verified"
    ) || null;

  return {
    authenticated: true,
    required,
    hasVerifiedFactor:
      Boolean(verifiedTotp),
    verifiedFactor:
      verifiedTotp,
    currentLevel:
      aalResult.data?.currentLevel || null,
    nextLevel:
      aalResult.data?.nextLevel || null,
  };
}

export async function challengeTotp(
  factorId: string,
  code: string
) {
  const cleanCode =
    code.replace(/\D/g, "").slice(0, 6);

  if (cleanCode.length !== 6) {
    throw new Error(
      "Ingresa el código de 6 dígitos."
    );
  }

  const {
    data: challenge,
    error: challengeError,
  } =
    await supabase.auth.mfa.challenge({
      factorId,
    });

  if (challengeError) {
    throw challengeError;
  }

  const {
    error: verifyError,
  } =
    await supabase.auth.mfa.verify({
      factorId,
      challengeId:
        challenge.id,
      code: cleanCode,
    });

  if (verifyError) {
    throw verifyError;
  }
}
