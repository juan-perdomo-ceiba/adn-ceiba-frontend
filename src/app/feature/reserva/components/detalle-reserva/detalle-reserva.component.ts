import { Component, Input, OnInit } from '@angular/core';
import { Reserva } from '@reserva/shared/model/reserva';

@Component({
  selector: 'app-detalle-reserva',
  templateUrl: './detalle-reserva.component.html',
  styleUrls: ['./detalle-reserva.component.css']
})
export class DetalleReservaComponent implements OnInit {
  @Input() reserva: Reserva;

  constructor() { }

  ngOnInit() {
  }

}
