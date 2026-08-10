import { BaseTransformer } from '@adonisjs/core/transformers'
import type { DashboardStats } from '#types/dashboard'

/**
 * Shapes the aggregated {@link DashboardStats} snapshot for the Inertia
 * dashboard page. Sections are passed through as-is: whatever the registry
 * aggregated reaches the page untouched, so a newly registered collector
 * needs no change here — and a section absent from the payload is simply
 * not rendered. Luxon `DateTime` values are passed through and serialize
 * to ISO strings in the JSON payload.
 */
export default class DashboardTransformer extends BaseTransformer<DashboardStats> {
  async toObject() {
    return { ...this.resource }
  }
}
