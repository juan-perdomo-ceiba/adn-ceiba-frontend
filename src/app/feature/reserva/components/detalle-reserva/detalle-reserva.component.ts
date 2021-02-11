import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { ReservaService } from '@reserva/shared/service/reserva.service';
import { Reserva } from '@reserva/shared/model/reserva';

@Component({
  selector: 'app-detalle-reserva',
  templateUrl: './detalle-reserva.component.html',
  styleUrls: ['./detalle-reserva.component.css']
})
export class DetalleReservaComponent implements OnInit, OnDestroy {
  readonly PARAMETRO_ID_PAQUETE_TURISTICO = "id";
  private $subscriptionConsultarReservaPorId: Subscription;
  public reserva = {} as Reserva;

  constructor(
    protected reservaServices: ReservaService,protected router: Router, protected activeRoute: ActivatedRoute) { }

  ngOnInit() {
    const idReserva = this.activeRoute.snapshot.paramMap.get(this.PARAMETRO_ID_PAQUETE_TURISTICO);
    this.$subscriptionConsultarReservaPorId = this.reservaServices.consultarPorId(idReserva).subscribe(response => this.reserva = response);
  }

  ngOnDestroy() {
    this.$subscriptionConsultarReservaPorId.unsubscribe();
  }
}
