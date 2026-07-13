import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PoliceStation } from './entities/police-station.entity';
import { CreatePoliceStationDto } from './dto/create-police-station.dto';

@Injectable()
export class PoliceStationsService {
  constructor(
    @InjectRepository(PoliceStation)
    private readonly stationRepo: Repository<PoliceStation>,
  ) {}

  async create(dto: CreatePoliceStationDto) {
    const station = this.stationRepo.create({
      name: dto.name.trim(),
      address: dto.address.trim(),
      contact_number: dto.contact_number.trim(),
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
      place_id: dto.place_id?.trim() || null,
      formatted_address: dto.formatted_address?.trim() || null,
    });
    const saved = await this.stationRepo.save(station);
    return {
      message: 'Police station created successfully',
      station: saved,
    };
  }

  async findAll() {
    const stations = await this.stationRepo.find({
      order: { name: 'ASC' },
      select: [
        'id',
        'name',
        'address',
        'contact_number',
        'latitude',
        'longitude',
        'place_id',
        'formatted_address',
      ],
    });
    return {
      message: 'Police stations retrieved successfully',
      stations,
    };
  }
}
