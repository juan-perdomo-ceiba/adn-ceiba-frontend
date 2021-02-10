import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

import { Reserva } from '@reserva/shared/model/reserva';
import { ReservaService } from '@reserva/shared/service/reserva.service';

@Component({
  selector: 'app-listar-reserva',
  templateUrl: './listar-reserva.component.html',
  styleUrls: ['./listar-reserva.component.css']
})
export class ListarReservaComponent implements OnInit {
  public listaReservas: Observable<Reserva[]>;

  constructor(protected reservaServices: ReservaService) { }

  ngOnInit() {
    this.listaReservas = this.reservaServices.consultar();
  }
}
