import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ReservaService } from '@reserva/shared/service/reserva.service';
import { Reserva } from '@reserva/shared/model/reserva';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-consultar-reserva',
  templateUrl: './consultar-reserva.component.html',
  styleUrls: ['./consultar-reserva.component.css']
})
export class ConsultarReservaComponent implements OnInit, OnDestroy {
  public identificadorReserva: string;
  private $subscreibeConsultaReserva: Subscription;
  public reserva = {} as Reserva;

  constructor(
    protected reservaServices: ReservaService, protected router: Router) { }

  ngOnInit() {
  }

  public consultarReserva() {
    this.$subscreibeConsultaReserva = this.reservaServices.consultarPorIdentificador(this.identificadorReserva).subscribe(response => this.reserva = response);
  }

  ngOnDestroy() {
    this.$subscreibeConsultaReserva.unsubscribe();
  }
  
}
