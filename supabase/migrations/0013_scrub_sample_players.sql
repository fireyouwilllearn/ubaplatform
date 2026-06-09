-- Scrub all sample/player-fixture rows that were temporarily inserted by the
-- previous player seed migration. The real source of truth is now the team
-- Google Sheets importer, so retaining these identities in production would be
-- more dangerous than showing empty roster states.

delete from public.players
where slug in ('p-001', 'p-002', 'p-003', 'p-004', 'p-005', 'p-006')
   or gamertag in (
     'ApexMiddy',
     'PaintWarden',
     'WingAudit',
     'CornerReceipt',
     'GlassTax',
     'ForgeTempo'
   );
