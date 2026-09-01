-- QR tracking con atribución (P1/P2): cada restaurante genera un QR único
-- (?qr=restaurantId) para su flyer de mesa. El escaneo se registra como evento
-- QR_SCAN en analytics_events (ya permitido por la política de insert existente,
-- incluso sin sesión — el escáner normalmente no tiene cuenta todavía).
--
-- Falta permitir que CADA restaurante vea sus propios escaneos (para el KPI en su
-- AnalyticsPage) sin darle acceso al resto de eventos — la política de admin ya
-- existente sigue dando visibilidad completa solo a is_admin().

create policy "Restaurante ve sus propios escaneos QR"
  on public.analytics_events for select
  using (
    event_name = 'QR_SCAN'
    and metadata->>'restaurant_id' = auth.uid()::text
  );
