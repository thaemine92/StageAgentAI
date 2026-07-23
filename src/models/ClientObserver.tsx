import { Client } from '../models/Clients';

type Observer = (clients: Client[]) => void;

class ClientStore {
  private observers: Observer[] = [];
  private clients: Client[] = [];

  // Inscription à l'observateur
  subscribe(fn: Observer) {
    this.observers.push(fn);
  }

  // Désinscription
  unsubscribe(fn: Observer) {
    this.observers = this.observers.filter((obs) => obs !== fn);
  }

  // Notifier tous les composants abonnés
  private notify() {
    this.observers.forEach((fn) => fn(this.clients));
  }

  // Mise à jour de la donnée et déclenchement de la notification
  setClients(newClients: Client[]) {
    this.clients = newClients;
    this.notify();
  }
  
  // Getter pour récupérer les clients actuels
  getClients(): Client[] {
    return this.clients;
  }
}

// On exporte une instance unique (Singleton) pour que toute l'app utilise le même store
export const clientStore = new ClientStore();