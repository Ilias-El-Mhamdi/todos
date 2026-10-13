import type { AppStateEntity } from './appState.entity';

export abstract class IAppStateReaderRepo {
  abstract find(userId: string, key: string): Promise<AppStateEntity | null>;
}
