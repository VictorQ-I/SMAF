import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './domain/entities/user.entity';
import { UsersController } from './presentation/controllers/users.controller';
import { UsersService } from './application/services/users.service';
import { TypeOrmUserRepository } from './infrastructure/persistence/repositories/typeorm-user.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: 'UserRepository',
      useClass: TypeOrmUserRepository,
    },
  ],
  exports: ['UserRepository', UsersService],
})
export class UsersModule {}




