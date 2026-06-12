-- Add indexes for user-scoped visit lists, filters, map rollups, and insights.
CREATE INDEX "visits_user_id_visited_at_idx" ON "visits"("user_id", "visited_at");
CREATE INDEX "visits_user_id_country_id_idx" ON "visits"("user_id", "country_id");
CREATE INDEX "visits_user_id_city_id_idx" ON "visits"("user_id", "city_id");
