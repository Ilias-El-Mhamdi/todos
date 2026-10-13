import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDataSource } from './dataSource';

@Module({
  imports: [TypeOrmModule.forRoot(AppDataSource.options)],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
