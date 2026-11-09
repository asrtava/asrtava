import { IMapsLocationProvider } from '../interfaces';
import { HealthStatus } from '../../types';

export class MapsLocationAdapter implements IMapsLocationProvider {
  public readonly providerCode = 'maps_google';

  public async testConnection(
    credentials: Record<string, any>,
    config: Record<string, any>
  ): Promise<{ status: HealthStatus; latencyMs: number; message: string }> {
    return {
      status: 'healthy',
      latencyMs: 12,
      message: 'Maps and Geolocation Service ready',
    };
  }

  public async geocodeAddress(
    address: string,
    credentials: Record<string, any>
  ): Promise<{ latitude: number; longitude: number; formattedAddress: string }> {
    // Standard mock/sandbox coordinates (e.g. Bangalore central medical district)
    return {
      latitude: 12.9716,
      longitude: 77.5946,
      formattedAddress: address,
    };
  }

  /**
   * Computes great-circle distance between two coordinates in kilometers using Haversine formula
   */
  public calculateDistanceKm(
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number }
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
    const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((from.latitude * Math.PI) / 180) *
        Math.cos((to.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100;
  }
}

