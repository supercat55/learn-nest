import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateMeetingRoomDto } from './dto/create-meeting-room.dto';
import { UpdateMeetingRoomDto } from './dto/update-meeting-room.dto';
import { MeetingRoom } from './entities/meeting-room.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';

@Injectable()
export class MeetingRoomService {
  @InjectRepository(MeetingRoom)
  private meetingRoomRepository: Repository<MeetingRoom>;

  initData() {
    const room1 = new MeetingRoom();
    room1.name = '木星';
    room1.capacity = 10;
    room1.equipment = '白板';
    room1.location = '一层西';

    const room2 = new MeetingRoom();
    room2.name = '金星';
    room2.capacity = 5;
    room2.equipment = '';
    room2.location = '二层东';

    const room3 = new MeetingRoom();
    room3.name = '天王星';
    room3.capacity = 30;
    room3.equipment = '白板，电视';
    room3.location = '三层东';

    void this.meetingRoomRepository.save([room1, room2, room3]);
  }

  async create(createMeetingRoomDto: CreateMeetingRoomDto) {
    const room = await this.meetingRoomRepository.findOneBy({
      name: createMeetingRoomDto.name,
    });

    if (room) {
      throw new BadRequestException('会议室已存在');
    }
    await this.meetingRoomRepository.insert(createMeetingRoomDto);

    return 'success';
  }

  async findList({
    pageNo,
    pageSize,
    name,
    capacity,
    equipment,
  }: {
    pageNo: number;
    pageSize: number;
    name: string;
    capacity: number;
    equipment: string;
  }) {
    if (pageNo < 1) {
      throw new BadRequestException('页码最小为 1');
    }
    const skipCount = (pageNo - 1) * pageSize;

    const condition: Record<string, any> = {};

    if (name) {
      condition.name = Like(`%${name}%`);
    }
    if (equipment) {
      condition.equipment = Like(`%${equipment}%`);
    }
    if (capacity) {
      condition.capacity = capacity;
    }

    const [result, total] = await this.meetingRoomRepository.findAndCount({
      skip: skipCount,
      take: pageSize,
      where: condition,
    });

    return {
      result,
      total,
    };
  }

  findOne(id: number) {
    return this.meetingRoomRepository.findOneBy({
      id,
    });
  }

  async update(updateMeetingRoomDto: UpdateMeetingRoomDto) {
    const meetingRoom = await this.meetingRoomRepository.findOneBy({
      id: updateMeetingRoomDto.id,
    });

    if (!meetingRoom) {
      throw new BadRequestException('会议室不存在');
    }

    if (updateMeetingRoomDto.capacity !== undefined) {
      meetingRoom.capacity = updateMeetingRoomDto.capacity;
    }
    if (updateMeetingRoomDto.location !== undefined) {
      meetingRoom.location = updateMeetingRoomDto.location;
    }
    if (updateMeetingRoomDto.name !== undefined) {
      meetingRoom.name = updateMeetingRoomDto.name;
    }

    if (updateMeetingRoomDto.description) {
      meetingRoom.description = updateMeetingRoomDto.description;
    }
    if (updateMeetingRoomDto.equipment) {
      meetingRoom.equipment = updateMeetingRoomDto.equipment;
    }

    await this.meetingRoomRepository.update(
      {
        id: meetingRoom.id,
      },
      meetingRoom,
    );
    return 'success';
  }

  async remove(id: number) {
    await this.meetingRoomRepository.delete(id);
    return 'success';
  }
}
