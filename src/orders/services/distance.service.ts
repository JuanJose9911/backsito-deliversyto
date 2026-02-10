import { Injectable, Logger } from '@nestjs/common';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface DistanceResult {
  distanceKm: number;
  method: 'haversine' | 'google';
}

@Injectable()
export class DistanceService {
  private readonly logger = new Logger(DistanceService.name);
  private readonly EARTH_RADIUS_KM = 6371;

  /**
   * Calcular distancia entre dos puntos usando Haversine
   * Precisión: ~80-85% en ciudades con cuadrícula
   * Ventaja: Gratis e instantáneo
   */
  calculateWithHaversine(from: Coordinates, to: Coordinates): number {
    const lat1Rad = this.toRadians(from.latitude);
    const lat2Rad = this.toRadians(to.latitude);
    const deltaLatRad = this.toRadians(to.latitude - from.latitude);
    const deltaLngRad = this.toRadians(to.longitude - from.longitude);

    // Fórmula Haversine
    const a =
      Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
      Math.cos(lat1Rad) *
        Math.cos(lat2Rad) *
        Math.sin(deltaLngRad / 2) *
        Math.sin(deltaLngRad / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = this.EARTH_RADIUS_KM * c;

    // Agregar 20% de margen para compensar rutas no directas
    const adjustedDistance = distance * 1.2;

    return Math.round(adjustedDistance * 100) / 100; // 2 decimales
  }

  /**
   * Calcular distancia - método principal
   * TODO: Agregar soporte para Google Distance Matrix API
   */
  async calculateDistance(
    from: Coordinates,
    to: Coordinates,
    useAccurate = false,
  ): Promise<DistanceResult> {
    // Por ahora solo Haversine
    // En el futuro: if (useAccurate && hasGoogleAPI) → usar Google Matrix
    
    if (useAccurate) {
      this.logger.warn(
        'Google Distance Matrix no configurado. Usando Haversine como fallback.',
      );
    }

    const distanceKm = this.calculateWithHaversine(from, to);

    return {
      distanceKm,
      method: 'haversine',
    };
  }

  /**
   * Buscar entidades cercanas dentro de un radio
   * Retorna array ordenado por distancia (más cercano primero)
   */
  findNearby<T extends Coordinates>(
    center: Coordinates,
    entities: T[],
    radiusKm: number,
  ): Array<T & { distance: number }> {
    const results = entities
      .map((entity) => ({
        ...entity,
        distance: this.calculateWithHaversine(center, entity),
      }))
      .filter((item) => item.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    return results;
  }

  /**
   * Calcular tiempo estimado basado en distancia
   * Asume velocidad promedio de 30 km/h en ciudad
   */
  estimateDurationMinutes(distanceKm: number, speedKmh = 30): number {
    const hours = distanceKm / speedKmh;
    const minutes = Math.ceil(hours * 60);
    
    // Mínimo 5 minutos, máximo 120 minutos
    return Math.max(5, Math.min(minutes, 120));
  }

  /**
   * Convertir grados a radianes
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
