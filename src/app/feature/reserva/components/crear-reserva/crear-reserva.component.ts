import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { LugarTuristicoService } from '@lugar-turistico/shared/service/lugar-turistico.service';
import { Observable, Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { LugarTuristico } from '@lugar-turistico/shared/model/lugar-turistico';
import { PaqueteTuristicoService } from '@paquete-turistico/shared/service/paquete-turistico.service';
import { PaqueteTuristico } from '@paquete-turistico/shared/model/paquete-turistico';
import { ReservaService } from '@reserva/shared/service/reserva.service';
@Component({
  selector: 'app-crear-reserva',
  templateUrl: './crear-reserva.component.html',
  styleUrls: ['./crear-reserva.component.css']
})
export class CrearReservaComponent implements OnInit, OnDestroy {
  readonly PARAMETRO_ID_PAQUETE_TURISTICO = "id";
  public reservaForm: FormGroup;
  public $lugaresTuristicos: Observable<LugarTuristico[]>;
  private $subscriptionConsultarPaqueteTuristicoPorId: Subscription;
  public paqueteTuristico = {} as PaqueteTuristico;

  constructor(
    protected lugarTuristicoServices: LugarTuristicoService, protected reservaServices: ReservaService,protected router: Router, 
    protected paqueteTuristicoServices: PaqueteTuristicoService, protected activeRoute: ActivatedRoute) { }

  ngOnInit() {
    this.construirFormularioProducto();
    this.$lugaresTuristicos = this.lugarTuristicoServices.consultar();
    const idPaqueteTuristico = this.activeRoute.snapshot.paramMap.get(this.PARAMETRO_ID_PAQUETE_TURISTICO);
    this.$subscriptionConsultarPaqueteTuristicoPorId = this.paqueteTuristicoServices.consultarPorId(idPaqueteTuristico).subscribe(response => this.paqueteTuristico = response);
  }

  crear() {
    let reserva = this.reservaForm.value;
    reserva.precio = this.paqueteTuristico.precioPorPersona * this.paqueteTuristico.precioPorPersona;
    reserva.identificadorReserva = 'xxxxxx';
    reserva.idPaqueteTuristico = this.paqueteTuristico.id;
    this.reservaServices.guardar(reserva).subscribe(
      () => this.router.navigateByUrl('home')
    );
  }

  private construirFormularioProducto() {
    this.reservaForm = new FormGroup({
      fechaReserva: new FormControl('', [Validators.required]),
      cedulaCliente: new FormControl('', [Validators.required]),
      nombreCliente: new FormControl('', [Validators.required]),
      telefonoCliente: new FormControl('', [Validators.required]),
      emailCliente: new FormControl('', [Validators.required]),
      numeroPersonas: new FormControl('', [Validators.required]),
      observaciones: new FormControl('')                                                   
    });
  }

  ngOnDestroy() {
    this.$subscriptionConsultarPaqueteTuristicoPorId.unsubscribe();
  }

}
