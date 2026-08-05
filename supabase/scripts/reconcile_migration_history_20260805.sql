-- ===========================================================================
-- Migration history reconciliation — 2026-08-05
--
-- WHY: the remote history table listed only 9 migrations while 168 had in fact
-- been applied (most were run through the dashboard SQL editor, which does not
-- record them). 'supabase db push' therefore saw ~160 migrations as pending and
-- would have tried to replay already-applied DDL.
--
-- WHAT THIS DOES: records the migrations that were verified as already applied.
-- It inserts history rows ONLY. It runs no DDL and changes no schema or data.
--
-- HOW APPLIED-STATE WAS VERIFIED: every CREATE TABLE / VIEW / FUNCTION, every
-- ALTER TABLE ... ADD COLUMN, every CREATE INDEX and every CREATE TRIGGER in
-- all 170 local migration files was extracted (229 objects across 116 files)
-- and checked against the live catalog. All were present except the ones noted
-- as excluded below.
--
-- DELIBERATELY NOT RECORDED (these are genuinely NOT applied — recording them
-- would permanently hide real pending work):
--   20260731141000_add_site_uptime_checks         table site_uptime_checks and
--                                                 its index do not exist
--   20260731170000_allow_admin_uptime_summary_reads
--                                                 adds a policy to that missing
--                                                 table; cannot have been applied
--   20260530_sentiment_real_data_views            expects national_sentiment_intelligence
--                                                 and predictive_impact_projections to be
--                                                 VIEWS; in production both are TABLES, so
--                                                 this migration would fail as written.
--                                                 Left without a valid version prefix on
--                                                 purpose so the CLI ignores it.
--
-- SAFE TO RE-RUN: the insert is guarded by ON CONFLICT DO NOTHING, and the nine
-- pre-existing rows are left untouched.
-- ===========================================================================

-- Snapshot first so the change can be undone.
create table if not exists supabase_migrations.schema_migrations_backup_20260805 as
  select * from supabase_migrations.schema_migrations;

insert into supabase_migrations.schema_migrations (version, name)
values
('20260529000000','create_apply_to_job_rpc'),
('20260529064710','create_push_subscriptions'),
('20260529075500','setup_blog_post_likes'),
('20260529090000','schedule_trash_auto_purge_90_days'),
('20260530000000','referral_system'),
('20260530000001','referral_system_fixes'),
('20260530000200','national_id_encryption_setup'),
('20260530000201','national_id_migrate_existing'),
('20260530000202','national_id_admin_rpc'),
('20260530000203','restrict_national_id_column_select'),
('20260530000300','create_get_member_count_rpc'),
('20260530000400','create_verified_and_registered_counts'),
('20260530000500','add_constituency_select_policy'),
('20260531000100','create_constituency_leaders'),
('20260531000200','csv_member_auth_fields'),
('20260601000100','create_newsletters'),
('20260602120000','add_polls_closing_notified'),
('20260602130000','allow_regional_admins_to_manage_ledger'),
('20260602140000','finance_officer_role_and_requests'),
('20260602140001','fix_finance_request_trigger'),
('20260602150000','add_chapter_to_donations'),
('20260602150045','fix_audit_order_dispatch_delivered_quantity_change'),
('20260602160000','fix_finance_requests_fk_to_public_users'),
('20260602170000','add_executive_role'),
('20260603000100','create_it_helpdesk'),
('20260603000200','fix_it_tickets_fk_to_public_users'),
('20260603000300','create_system_audit_logs'),
('20260603000400','drop_duplicate_audit_logs_admin_fk'),
('20260603000401','fix_provision_administrator_upsert'),
('20260603000500','fix_finance_approval_trigger_description_and_type'),
('20260603000600','add_category_to_finance_requests'),
('20260604000100','create_it_licenses'),
('20260605000100','hubtel_payment_columns'),
('20260605212543','add_admin_preferences'),
('20260605232625','add_admin_preferences'),
('20260606204500','fix_finance_requests_rls'),
('20260606210500','fix_admins_role_check_constraint'),
('20260606220000','add_hubtel_reference_columns'),
('20260606220001','fix_assets_rls'),
('20260607175916','fix_store_checkout_rls'),
('20260608000001','password_resets_admin_rls'),
('20260609000001','leader_messaging'),
('20260609000002','leader_messaging_fixes'),
('20260609000003','receipts_bucket'),
('20260609000004','add_chapter_to_admins'),
('20260610000100','conversations_unique_member_scope_type'),
('20260610000200','conversations_leader_fk_users_and_leader_backfill'),
('20260610000300','auto_provision_lead_admin_roles'),
('20260611000100','helpdesk_departments_lead_id'),
('20260611000200','receipts_bucket_size_limit_2mb'),
('20260611000300','messaging_enhancements'),
('20260611000400','message_anti_flood_and_group_forums'),
('20260611000500','group_conversation_members_rls'),
('20260611000600','security_advisor_hardening'),
('20260611000700','perf_rls_initplan_hot_tables'),
('20260611000800','perf_rls_initplan_remaining_tables'),
('20260611000900','fix_group_message_policy_scope'),
('20260611000950','perf_consolidate_permissive_policies_batch1'),
('20260611001000','perf_consolidate_permissive_policies_batch2'),
('20260611001100','guest_order_access_via_rpc'),
('20260611001200','leaderboard_views_invoker_plus_rpc'),
('20260612000100','public_donation_stats_rpc'),
('20260612000200','public_donation_feed_rpc'),
('20260612001000','it_notes_archive'),
('20260613230825','admin_device_tracking'),
('20260613234500','admin_webauthn_challenges'),
('20260614090000','create_redirect_rules'),
('20260614120000','sheets_activity_sync'),
('20260614135047','fix_finance_request_reviewer_rls'),
('20260614141101','fix_finance_request_trigger_rls'),
('20260614150000','job_taxonomy_schema'),
('20260614150100','job_taxonomy_seed'),
('20260614150200','job_analytics_rpc'),
('20260615120000','job_taxonomy_id_sequences'),
('20260615140000','member_sessions_update_policy'),
('20260615150000','member_kyc_table'),
('20260615150100','member_kyc_storage_bucket'),
('20260615160000','leader_activity_feed'),
('20260615170000','leader_action_audit_triggers'),
('20260615180000','tighten_internal_rls_reads'),
('20260615180100','scope_conversations_rls'),
('20260615180200','tighten_asset_rls_reads'),
('20260615180300','chapter_poll_results_rpc'),
('20260615180400','rls_reads_followups'),
('20260616000000','constituency_leader_writes'),
('20260616010000','leader_activity_text_casts'),
('20260616020000','security_advisor_fixes'),
('20260616030000','security_posture_summary_fn'),
('20260616040000','schedule_security_digest_weekly'),
('20260616050000','scope_conversations_insert'),
('20260616060000','activity_digest_summary_fn'),
('20260616070000','schedule_activity_digest_weekly'),
('20260616080000','discord_leader_audit_trigger'),
('20260616090000','leaders_auth_activity_rpcs'),
('20260616094000','leaders_auth_rpc_strict_casts'),
('20260616100000','fix_leaders_auth_rpc_guard_aliases'),
('20260616103000','rewrite_leaders_auth_rpc_as_sql'),
('20260617120000','bank_transfer_details'),
('20260617120001','block_admin_device_rebind'),
('20260617140000','party_tiers_accent_color'),
('20260618173000','harden_newsletter_authorization'),
('20260618190000','harden_finance_review_authorization'),
('20260618194000','fix_device_step_up_rpc'),
('20260619020000','device_activity_isp_and_full_log'),
('20260619053000','leaders_auth_logout_and_discord_trigger'),
('20260619095531','discord_alerts_reasons_and_descriptions'),
('20260619142000','revert_useragent_fingerprint_bypass'),
('20260619172000','enrich_block_alerts_with_browser'),
('20260619173500','enforce_brave_browser'),
('20260620182011','allow_brave_webauthn_recovery'),
('20260620184432','use_leader_names_in_webhooks'),
('20260621000000','stable_device_fingerprint_isp_tolerance'),
('20260621020453','fix_null_donation_reference'),
('20260621023500','self_heal_webauthn_enrolled'),
('20260621142717','restrict_constituency_leaders_rls'),
('20260621152656','enforce_audit_logs_immutability'),
('20260622000000','fix_device_fingerprint_webauthn_cross_device'),
('20260622140000','add_followup_sent_at'),
('20260623000000','add_donation_reminder_sent_at'),
('20260624000100','media_hub_tables'),
('20260628011154','consolidate_helpdesk_departments'),
('20260628201000','job_taxonomy_usage_rpc'),
('20260628213000','update_get_db_stats'),
('20260629000000','sync_member_constituencies'),
('20260630000100','discord_forced_logout_alert'),
('20260630010000','regional_member_counts_rpc'),
('20260630020000','public_stats_add_countries'),
('20260706001000','add_newsletter_subscriber_phone'),
('20260711010000','harden_donation_callback'),
('20260711010100','add_receipt_delivery_state'),
('20260711115720','harden_donation_callback'),
('20260711125247','harden_donation_callback'),
('20260711213939','enforce_member_network_assignment'),
('20260712084828','monthly_dues_core'),
('20260712093228','monthly_dues_operations'),
('20260712120500','purge_rejected_members'),
('20260712145500','add_voters_id_and_polling_station'),
('20260712150000','royalty_points_automation'),
('20260712213000','add_momo_number_to_bank_details'),
('20260713091700','add_missing_constituencies'),
('20260714103400','update_network_assignment_allow_diaspora_constituency'),
('20260714114000','add_link_imported_member_profile'),
('20260715000000','remove_dummy_emails'),
('20260715000100','remove_placeholders'),
('20260716190053','member_registration_sequence'),
('20260717234218','hard_delete_members'),
('20260718010228','update_hero_bg_setting'),
('20260722202611','add_users_verified_at_and_trigger'),
('20260724010000','secure_guest_donations'),
('20260729100000','add_engagement_status_column'),
('20260729100100','schedule_categorize_engagement_daily'),
('20260729100700','cron_monitor_rpcs'),
('20260729101000','resolve_audit_log_resource_names'),
('20260730180000','harden_admin_and_chapter_rls'),
('20260730190000','persistent_rate_limits_and_security_helpers'),
('20260730200000','atomic_rate_limiter_and_otp_invalidation'),
('20260730210000','rate_limit_peek_and_record'),
('20260731051700','fix_admins_rls_select_self'),
('20260731202310','password_recovery_requests'),
('20260801100000','fix_referral_trigger_and_leaderboard_points'),
('20260802153000','reconcile_ec_constituencies_and_resilient_trigger'),
('20260802160000','reconcile_polling_stations'),
('20260803000000','expand_emergency_relationship_values'),
('20260803000100','normalize_platform_casing'),
('20260803000200','password_reset_webhook_alert'),
('20260803164630','get_own_national_id'),
('20260803164631','impact_projects_migration')
on conflict (version) do nothing;

-- Verify: expect 167 total. All nine pre-existing rows are themselves real
-- migration files and so appear in the list above; ON CONFLICT skips them
-- rather than adding to the count. 167 = 169 versioned files - 2 unapplied.
select count(*) as total_recorded from supabase_migrations.schema_migrations;
