import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import * as io from 'socket.io-client';
import { Observable } from 'rxjs';

const serverURL = environment.apiEndPoint;

@Injectable({
  providedIn: 'root'
})
export class ClientSocketService {

  private socket;

  constructor() { }


  public initSocket(): void {
    this.socket = io(serverURL);
  }


  public onEvent(event: Event): Observable<any> {
    return;
    // return new Observable<Event>(observer => {
    //   this.socket.on(event, () => observer.next());
    // });
  }
}
