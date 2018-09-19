import { Injectable } from '@angular/core';

import * as IOClient from 'socket.io-client';

@Injectable()
export class SocketService {
  connect(baseUrl: string) {
    return IOClient(baseUrl);
  }
}
