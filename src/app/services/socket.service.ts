import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket!: Socket;
  private apiUrl = environment.apiUrl;

  constructor() {
    this.connect();
  }

  private connect() {
    // Strips /api to get socket server root
    let url = this.apiUrl;
    if (url.endsWith('/api')) {
      url = url.substring(0, url.length - 4);
    }

    this.socket = io(url, {
      transports: ['websocket'],
      autoConnect: true
    });

    this.socket.on('connect', () => {
      console.log('Delivery Agent Socket connected successfully:', this.socket.id);
      this.rejoinRooms();
    });

    this.socket.on('connect_error', (err: any) => {
      console.error('Delivery Agent Socket connection error:', err);
    });
  }

  joinRoom(roomName: string) {
    if (this.socket) {
      this.socket.emit('join', roomName);
      console.log(`Delivery Agent requested to join room: ${roomName}`);
    }
  }

  private rejoinRooms() {
    const agentDataStr = localStorage.getItem('agent_data');
    if (agentDataStr) {
      try {
        const agentData = JSON.parse(agentDataStr);
        if (agentData && agentData.id) {
          this.joinRoom(`agent_${agentData.id}`);
        }
      } catch (e) {
        console.error('Failed to parse agent_data for socket room joining', e);
      }
    }
  }

  onEvent(eventName: string): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on(eventName, (data: any) => {
        subscriber.next(data);
      });
      return () => {
        this.socket.off(eventName);
      };
    });
  }
}
