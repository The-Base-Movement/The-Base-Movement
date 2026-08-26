-- assign_member_registration_number() is SECURITY INVOKER and calls
-- nextval() on this sequence, but `authenticated` never had USAGE on it.
-- This broke the legitimate self-heal path (memberService.ensureRegistrationNumber,
-- called from Login.tsx on the member's own row) for any real member with a
-- malformed registration_number. Found while verifying the
-- block_privileged_self_update fix didn't regress it. Unrelated pre-existing
-- bug, fixed alongside.
GRANT USAGE ON SEQUENCE public.member_registration_number_seq TO authenticated;
