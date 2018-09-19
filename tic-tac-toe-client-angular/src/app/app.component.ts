import { Component, ElementRef } from '@angular/core';

import { SocketService } from './app.service';

interface IState {
  [patern: string]: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [SocketService]
})

export class AppComponent {
  stateIndexs: String[] = ['a0', 'a1', 'a2', 'b0', 'b1', 'b2', 'c0', 'c1', 'c2'];
  message: string = 'Waiting for opponent to join...';
  disabled: boolean = false;

  private _myTurn: boolean = false;
  private _baseUrl: string = 'http://localhost:3000';
  private _playerSymbol: string = '';
  private _socket;
  private _buttons: any;
  private _content: any;

  constructor(private elementRef: ElementRef, private socketService: SocketService) {}

  /* hooks */
  ngOnInit() {
    this._socket = this.socketService.connect(this._baseUrl);

    this._socket.on('game.begin', data => {
      this._playerSymbol = data.playerSymbol;
      this._myTurn = this._playerSymbol === 'X';
      this._renderTurnMessage();
    });

    this._socket.on('opponent.left', () => {
      this.message = 'Your opponent left the game.';
      this._disabledBord(true);
    });

    this._socket.on('move.made', data => {
      this._content.querySelector(`#${data.position}`).innerText = data.playerSymbol;

      this._myTurn = data.playerSymbol !== this._playerSymbol;
      if (this._isGameOver()) {
        this.message = this._myTurn ? 'Game over. You lost.' : 'Game over. You won!';
        this._disabledBord(true);
      } else {
        this._renderTurnMessage();
      }
    });
  }

  ngAfterViewInit(): void {
    this._content = this.elementRef.nativeElement;
    this._buttons = this._content.querySelectorAll('button');
  }

  /* public methods */
  makeMove(event, index) {
    event.preventDefault();

    if (!this._myTurn || event.target.textContent.length) {
      return;
    }

    this._socket.emit('make.move', {
      playerSymbol: this._playerSymbol,
      position: index
    });
  }

  /* private methods */
  _renderTurnMessage() {
    if (this._myTurn) {
      this.message = 'Your turn.';
      this._disabledBord(false);
    } else {
      this.message = 'Your opponent\'s turn';
      this._disabledBord(true);
    }
  }

  _disabledBord(isDisable) {
    this._buttons.forEach(elem => {
      this.disabled = isDisable;
    });
  }

  _isGameOver() {
    const state = this._getBoardState();
    const matches = ['XXX', 'OOO'];
    const rows = [
      state.a0 + state.a1 + state.a2,
      state.b0 + state.b1 + state.b2,
      state.c0 + state.c1 + state.c2,
      state.a0 + state.b1 + state.c2,
      state.a2 + state.b1 + state.c0,
      state.a0 + state.b0 + state.c0,
      state.a1 + state.b1 + state.c1,
      state.a2 + state.b2 + state.c2
    ];

    for (let i = 0; i < rows.length; i++) {
      if (rows[i] === matches[0] || rows[i] === matches[1]) {
        return true;
      }
    }
  }

  _getBoardState() {
    const bord: IState = {};

    this._buttons.forEach((elem, i) => {
      bord[elem.getAttribute('id')] = elem.textContent || '';
    });

    return bord;
  }

}
