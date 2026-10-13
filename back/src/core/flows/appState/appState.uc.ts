import { ConflictException, Injectable } from '@nestjs/common';
import { IAppStateReaderRepo } from '../../repos/appState/appState.reader.abstract-repo';
import { IAppStateWriterRepo } from '../../repos/appState/appState.writer.abstract-repo';

export interface StateSnapshot {
  value: unknown;
  updatedAt: string | null;
}

@Injectable()
export class AppStateUc {
  constructor(
    private readonly reader: IAppStateReaderRepo,
    private readonly writer: IAppStateWriterRepo,
  ) {}

  async get(userId: string, key: string): Promise<StateSnapshot> {
    const state = await this.reader.find(userId, key);
    return { value: state?.value ?? null, updatedAt: state?.updatedAt.toISOString() ?? null };
  }

  /**
   * Écriture conditionnelle : `baseUpdatedAt` est la version serveur sur laquelle le client a travaillé (null = rien
   * encore en base). Si la base a bougé entre-temps (autre appareil), 409 avec la version actuelle : le serveur gagne.
   */
  async save(userId: string, key: string, value: unknown, baseUpdatedAt: string | null): Promise<StateSnapshot> {
    const current = await this.get(userId, key);
    if (current.updatedAt !== baseUpdatedAt) {
      throw new ConflictException({ message: 'Modifié depuis un autre appareil', ...current });
    }
    const state = await this.writer.upsert(userId, key, value);
    return { value: state.value, updatedAt: state.updatedAt.toISOString() };
  }
}
