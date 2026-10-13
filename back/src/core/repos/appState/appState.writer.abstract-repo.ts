import type { AppStateEntity } from './appState.entity';

export abstract class IAppStateWriterRepo {
  abstract upsert(userId: string, key: string, value: unknown): Promise<AppStateEntity>;
}
