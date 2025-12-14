import { Injectable } from '@nestjs/common';

export interface PricingCalculation {
  distance: number; // en kilómetros
  basePrice: number;
  distanceFee: number;
  serviceFee: number;
  totalPrice: number;
  estimatedDuration: number; // en minutos
}

@Injectable()
export class PricingService {
  // Tarifas base
  private readonly BASE_PRICE = 5000; // COP
  private readonly RATE_PER_KM_MOTORCYCLE = 1500; // COP/km
  private readonly RATE_PER_KM_CAR = 2000; // COP/km
  private readonly RATE_PER_KM_BICYCLE = 1000; // COP/km
  private readonly SERVICE_FEE_PERCENTAGE = 0.15; // 15%
  private readonly AVERAGE_SPEED_KMH = 25; // km/h velocidad promedio en ciudad

  /**
   * Calcula la distancia euclidiana entre dos puntos (en línea recta)
   * Fórmula Haversine simplificada para distancias cortas
   */
  calculateDistance(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
  ): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRad(destLat - originLat);
    const dLng = this.toRad(destLng - originLng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(originLat)) *
        Math.cos(this.toRad(destLat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Factor de corrección para distancia en carretera (aproximado 1.3x)
    return distance * 1.3;
  }

  /**
   * Calcula el precio total del pedido
   */
  calculatePrice(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
    vehicleType: string,
  ): PricingCalculation {
    // Calcular distancia
    const distance = this.calculateDistance(
      originLat,
      originLng,
      destLat,
      destLng,
    );

    // Seleccionar tarifa según tipo de vehículo
    let ratePerKm: number;
    switch (vehicleType) {
      case 'motorcycle':
        ratePerKm = this.RATE_PER_KM_MOTORCYCLE;
        break;
      case 'car':
        ratePerKm = this.RATE_PER_KM_CAR;
        break;
      case 'bicycle':
        ratePerKm = this.RATE_PER_KM_BICYCLE;
        break;
      default:
        ratePerKm = this.RATE_PER_KM_MOTORCYCLE;
    }

    // Calcular componentes del precio
    const distanceFee = distance * ratePerKm;
    const subtotal = this.BASE_PRICE + distanceFee;
    const serviceFee = subtotal * this.SERVICE_FEE_PERCENTAGE;
    const totalPrice = Math.round(subtotal + serviceFee);

    // Calcular tiempo estimado (distancia / velocidad promedio)
    const estimatedDuration = Math.round((distance / this.AVERAGE_SPEED_KMH) * 60);

    return {
      distance: Math.round(distance * 100) / 100, // 2 decimales
      basePrice: this.BASE_PRICE,
      distanceFee: Math.round(distanceFee),
      serviceFee: Math.round(serviceFee),
      totalPrice,
      estimatedDuration,
    };
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
