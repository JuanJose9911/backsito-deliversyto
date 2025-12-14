import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Driver } from './entities/driver.entity';
import { Vehicle } from './entities/vehicle.entity';
import { DriverDocument } from './entities/driver-document.entity';
import {
  RegisterDriverDto,
  UpdateLocationDto,
  UpdateDriverDto,
  UpdateStatusDto,
} from './dto';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    @InjectRepository(DriverDocument)
    private documentRepository: Repository<DriverDocument>,
    private dataSource: DataSource,
  ) {}

  async register(registerDriverDto: RegisterDriverDto): Promise<Driver> {
    // Verificar si el email ya existe
    const existingDriver = await this.driverRepository.findOne({
      where: { email: registerDriverDto.email },
    });

    if (existingDriver) {
      throw new ConflictException('El email ya está registrado');
    }

    // Verificar si el teléfono ya existe
    const existingPhone = await this.driverRepository.findOne({
      where: { phone: registerDriverDto.phone },
    });

    if (existingPhone) {
      throw new ConflictException('El teléfono ya está registrado');
    }

    // Verificar si el número de documento ya existe
    const existingDocument = await this.driverRepository.findOne({
      where: { documentNumber: registerDriverDto.documentNumber },
    });

    if (existingDocument) {
      throw new ConflictException('El número de documento ya está registrado');
    }

    // Usar transacción para crear driver + vehículo + documentos
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Hashear contraseña
      const hashedPassword = await bcrypt.hash(registerDriverDto.password, 10);

      // Crear driver
      const driver = this.driverRepository.create({
        name: registerDriverDto.name,
        email: registerDriverDto.email,
        password: hashedPassword,
        phone: registerDriverDto.phone,
        photo: registerDriverDto.photo,
        birthDate: new Date(registerDriverDto.birthDate),
        documentType: registerDriverDto.documentType,
        documentNumber: registerDriverDto.documentNumber,
        emergencyContactName: registerDriverDto.emergencyContactName,
        emergencyContactPhone: registerDriverDto.emergencyContactPhone,
        emergencyContactRelationship:
          registerDriverDto.emergencyContactRelationship,
        verificationStatus: 'pending',
        isActive: false,
        status: 'offline',
      });

      const savedDriver = await queryRunner.manager.save(Driver, driver);

      // Crear vehículo
      const vehicle = new Vehicle();
      vehicle.type = registerDriverDto.vehicle.type;
      vehicle.plate = registerDriverDto.vehicle.plate;
      vehicle.brand = registerDriverDto.vehicle.brand;
      vehicle.model = registerDriverDto.vehicle.model;
      vehicle.year = registerDriverDto.vehicle.year;
      vehicle.color = registerDriverDto.vehicle.color;
      vehicle.registrationPhoto = registerDriverDto.vehicle.registrationPhoto;
      vehicle.soatPhoto = registerDriverDto.vehicle.soatPhoto;
      vehicle.soatExpiryDate = registerDriverDto.vehicle.soatExpiryDate
        ? new Date(registerDriverDto.vehicle.soatExpiryDate)
        : undefined;
      vehicle.technicalReviewPhoto =
        registerDriverDto.vehicle.technicalReviewPhoto;
      vehicle.technicalReviewExpiryDate =
        registerDriverDto.vehicle.technicalReviewExpiryDate
          ? new Date(registerDriverDto.vehicle.technicalReviewExpiryDate)
          : undefined;
      vehicle.isActive = true;
      vehicle.verificationStatus = 'pending';
      vehicle.driver = savedDriver;

      const savedVehicle = await queryRunner.manager.save(Vehicle, vehicle);

      // Actualizar driver con el vehículo activo
      savedDriver.activeVehicleId = savedVehicle.id;
      await queryRunner.manager.save(Driver, savedDriver);

      // Crear documentos
      const documents = registerDriverDto.documents.map((doc) => {
        const document = new DriverDocument();
        document.type = doc.type;
        document.documentNumber = doc.documentNumber;
        document.photoUrl = doc.photoUrl;
        document.issueDate = doc.issueDate ? new Date(doc.issueDate) : undefined;
        document.expiryDate = doc.expiryDate ? new Date(doc.expiryDate) : undefined;
        document.status = 'pending';
        document.isCurrent = true;
        document.version = 1;
        document.driver = savedDriver;
        return document;
      });

      await queryRunner.manager.save(DriverDocument, documents);

      await queryRunner.commitTransaction();

      // Retornar driver sin contraseña
      const { password, ...driverWithoutPassword } = savedDriver;
      return driverWithoutPassword as Driver;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateLocation(
    driverId: string,
    latitude: number,
    longitude: number,
  ): Promise<{ success: boolean }> {
    const driver = await this.driverRepository.findOne({
      where: { id: driverId },
    });

    if (!driver) {
      throw new NotFoundException('Repartidor no encontrado');
    }

    await this.driverRepository.update(driverId, {
      currentLatitude: latitude,
      currentLongitude: longitude,
      lastLocationUpdate: new Date(),
    });

    return { success: true };
  }

  async findAll(): Promise<Driver[]> {
    return await this.driverRepository.find({
      select: [
        'id',
        'name',
        'email',
        'phone',
        'photo',
        'status',
        'isAvailable',
        'isActive',
        'verificationStatus',
        'currentLatitude',
        'currentLongitude',
      ],
    });
  }

  async findOne(id: string): Promise<Driver> {
    const driver = await this.driverRepository.findOne({
      where: { id },
    });

    if (!driver) {
      throw new NotFoundException('Repartidor no encontrado');
    }

    const { password, ...driverWithoutPassword } = driver;
    return driverWithoutPassword as Driver;
  }

  async update(id: string, updateDriverDto: UpdateDriverDto): Promise<Driver> {
    const driver = await this.driverRepository.findOne({
      where: { id },
    });
    
    if (!driver) {
      throw new NotFoundException('Repartidor no encontrado');
    }

    // Si se está actualizando el email, verificar que no exista
    if (updateDriverDto.email && updateDriverDto.email !== driver.email) {
      const existingEmail = await this.driverRepository.findOne({
        where: { email: updateDriverDto.email },
      });
      if (existingEmail) {
        throw new ConflictException('El email ya está registrado');
      }
    }

    // Si se está actualizando el teléfono, verificar que no exista
    if (updateDriverDto.phone && updateDriverDto.phone !== driver.phone) {
      const existingPhone = await this.driverRepository.findOne({
        where: { phone: updateDriverDto.phone },
      });
      if (existingPhone) {
        throw new ConflictException('El teléfono ya está registrado');
      }
    }

    // Si se actualiza la contraseña, hashearla
    if (updateDriverDto.password) {
      updateDriverDto.password = await bcrypt.hash(updateDriverDto.password, 10);
    }

    // Actualizar campos
    await this.driverRepository.update(id, updateDriverDto);

    // Obtener y retornar el driver actualizado sin password
    const updatedDriver = await this.driverRepository.findOne({
      where: { id },
    });

    if (!updatedDriver) {
      throw new NotFoundException('Repartidor no encontrado');
    }
    
    const { password, ...driverWithoutPassword } = updatedDriver;
    return driverWithoutPassword as Driver;
  }

  async getProfile(driverId: string): Promise<any> {
    const driver = await this.driverRepository.findOne({
      where: { id: driverId },
    });

    if (!driver) {
      throw new NotFoundException('Repartidor no encontrado');
    }

    // Obtener vehículo activo
    const activeVehicle = driver.activeVehicleId
      ? await this.vehicleRepository.findOne({
          where: { id: driver.activeVehicleId },
        })
      : null;

    // Obtener todos los vehículos
    const vehicles = await this.vehicleRepository.find({
      where: { driver: { id: driverId } },
      select: [
        'id',
        'type',
        'plate',
        'brand',
        'model',
        'year',
        'color',
        'isActive',
        'verificationStatus',
      ],
    });

    // Obtener documentos actuales
    const documents = await this.documentRepository.find({
      where: { driver: { id: driverId }, isCurrent: true },
      select: [
        'id',
        'type',
        'documentNumber',
        'status',
        'expiryDate',
        'version',
      ],
    });

    const { password, ...driverWithoutPassword } = driver;

    return {
      ...driverWithoutPassword,
      activeVehicle,
      vehicles,
      documents,
    };
  }

  async findByEmail(email: string): Promise<Driver | null> {
    return await this.driverRepository.findOne({
      where: { email },
    });
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateStatusDto,
  ): Promise<Driver> {
    const driver = await this.driverRepository.findOne({
      where: { id },
    });

    if (!driver) {
      throw new NotFoundException('Repartidor no encontrado');
    }

    // Validar que el driver esté verificado para cambiar a online
    if (updateStatusDto.status === 'online' && driver.verificationStatus !== 'approved') {
      throw new ConflictException('El repartidor debe estar verificado para conectarse');
    }

    // Actualizar estado
    await this.driverRepository.update(id, {
      status: updateStatusDto.status,
      isAvailable: updateStatusDto.isAvailable ?? (updateStatusDto.status === 'online'),
    });

    const updatedDriver = await this.driverRepository.findOne({
      where: { id },
    });

    if (!updatedDriver) {
      throw new NotFoundException('Repartidor no encontrado');
    }

    const { password, ...driverWithoutPassword } = updatedDriver;
    return driverWithoutPassword as Driver;
  }

  async getAvailableDrivers(vehicleType?: string): Promise<any[]> {
    const queryBuilder = this.driverRepository
      .createQueryBuilder('driver')
      .leftJoinAndSelect('driver.activeVehicleId', 'vehicle')
      .where('driver.status = :status', { status: 'online' })
      .andWhere('driver.isAvailable = :isAvailable', { isAvailable: true })
      .andWhere('driver.isActive = :isActive', { isActive: true })
      .andWhere('driver.verificationStatus = :verificationStatus', {
        verificationStatus: 'approved',
      })
      .select([
        'driver.id',
        'driver.name',
        'driver.phone',
        'driver.photo',
        'driver.currentLatitude',
        'driver.currentLongitude',
        'driver.lastLocationUpdate',
        'driver.rating',
        'driver.completedOrders',
      ]);

    // Si se especifica tipo de vehículo, filtrar por él
    if (vehicleType) {
      const vehicles = await this.vehicleRepository.find({
        where: { type: vehicleType, isActive: true },
      });
      const vehicleIds = vehicles.map((v) => v.id);
      
      if (vehicleIds.length > 0) {
        queryBuilder.andWhere('driver.activeVehicleId IN (:...vehicleIds)', {
          vehicleIds,
        });
      } else {
        return [];
      }
    }

    const drivers = await queryBuilder.getMany();

    // Obtener información del vehículo activo de cada driver
    const driversWithVehicles = await Promise.all(
      drivers.map(async (driver) => {
        const vehicle = driver.activeVehicleId
          ? await this.vehicleRepository.findOne({
              where: { id: driver.activeVehicleId },
              select: ['id', 'type', 'plate', 'brand', 'model'],
            })
          : null;

        return {
          ...driver,
          activeVehicle: vehicle,
        };
      }),
    );

    return driversWithVehicles;
  }
}
